const packs = [
  {
    id: "aula-groove",
    name: "Beat Aula",
    tempo: 96,
    description: "Bombo, caja y voces suaves para empezar.",
    tracks: [
      { id: "kick", name: "Bombo", emoji: "🟠", tags: ["pulso"], instrument: "kick", pattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], gain: 0.9 },
      { id: "snare", name: "Caja", emoji: "🟡", tags: ["backbeat"], instrument: "snare", pattern: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], gain: 0.7 },
      { id: "hat", name: "Hi-Hat", emoji: "🟢", tags: ["textura"], instrument: "hat", pattern: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1], gain: 0.5 },
      { id: "bass", name: "Bajo", emoji: "🔵", tags: ["nota: La"], instrument: "bass", root: 45, pattern: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0], gain: 0.7 },
      { id: "chords", name: "Capa armónica", emoji: "🟣", tags: ["acorde menor"], instrument: "chord", root: 57, pattern: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0], gain: 0.4 },
      { id: "vox", name: "Voz suave", emoji: "🟤", tags: ["oo-ya"], instrument: "voice", pattern: [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1], gain: 0.3 }
    ]
  },
  {
    id: "electro-patio",
    name: "Electro Patio",
    tempo: 110,
    description: "Ritmo marcado con sintes brillantes.",
    tracks: [
      { id: "kick", name: "Bombo profundo", emoji: "🟥", tags: ["pulso"], instrument: "kick", pattern: [1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1], gain: 0.95 },
      { id: "clap", name: "Clap", emoji: "🟧", tags: ["palma"], instrument: "snare", pattern: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0], gain: 0.65 },
      { id: "hat", name: "Hi-Hat cerrado", emoji: "🟩", tags: ["hi-hat"], instrument: "hat", pattern: [0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1], gain: 0.55 },
      { id: "perc", name: "Percusión", emoji: "🟦", tags: ["contratiempo"], instrument: "perc", pattern: [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0], gain: 0.5 },
      { id: "bass", name: "Bajo sintetizado", emoji: "🟪", tags: ["nota: Do"], instrument: "bass", root: 48, pattern: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0], gain: 0.7 },
      { id: "lead", name: "Lead brillante", emoji: "⬜", tags: ["melodía"], instrument: "lead", root: 72, pattern: [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1], gain: 0.35 }
    ]
  }
];

const ui = {
  trackGrid: document.getElementById("trackGrid"),
  playToggle: document.getElementById("playToggle"),
  tempo: document.getElementById("tempo"),
  tempoValue: document.getElementById("tempoValue"),
  packSelect: document.getElementById("packSelect"),
  packDescription: document.getElementById("packDescription"),
  startAudio: document.getElementById("startAudio"),
  installPwa: document.getElementById("installPwa"),
  muteAll: document.getElementById("muteAll"),
  stopAll: document.getElementById("stopAll"),
  addSampler: document.getElementById("addSampler")
};

const MAX_CUSTOM = 10;
let customTracks = [];
let currentPack = packs[0];

class EduBoxEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.noiseBuffer = null;
    this.tracks = [];
    this.pack = null;
    this.step = 0;
    this.isRunning = false;
    this.timer = null;
    this.lookahead = 0.08;
    this.soloing = new Set();
    this.masterMuted = false;
  }

  async ensureContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
      this.noiseBuffer = this.createNoiseBuffer();
    }
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
  }

  createNoiseBuffer() {
    const buffer = (this.ctx || new AudioContext()).createBuffer(1, 44100, 44100);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  usePack(pack, extraTracks = []) {
    this.pack = pack;
    const merged = [...pack.tracks, ...extraTracks];
    this.tracks = merged.map((t) => ({
      ...t,
      enabled: t.enabled || false,
      solo: t.solo || false,
      muted: t.muted || false,
      gainNode: this.ctx ? this.createTrackGain(t.gain) : null
    }));
    this.step = 0;
  }

  createTrackGain(value = 0.6) {
    const g = this.ctx.createGain();
    g.gain.value = value;
    g.connect(this.master);
    return g;
  }

  setTempo(bpm) {
    this.tempo = bpm;
    if (this.isRunning) {
      this.stop();
      this.play();
    }
  }

  toggleTrack(id) {
    const t = this.tracks.find((tr) => tr.id === id);
    if (!t) return;
    t.enabled = !t.enabled;
  }

  setGain(id, value) {
    const t = this.tracks.find((tr) => tr.id === id);
    if (t && t.gainNode) {
      t.gainNode.gain.setTargetAtTime(value, this.ctx.currentTime, 0.05);
    }
  }

  soloTrack(id) {
    const t = this.tracks.find((tr) => tr.id === id);
    if (!t) return;
    t.solo = !t.solo;
    if (t.solo) {
      this.soloing.add(id);
    } else {
      this.soloing.delete(id);
    }
  }

  muteAll(isMuted) {
    this.masterMuted = isMuted;
    if (this.master) {
      this.master.gain.value = isMuted ? 0 : 0.9;
    }
  }

  play() {
    if (!this.ctx || this.isRunning) return;
    this.isRunning = true;
    const intervalMs = (60 / this.tempo / 4) * 1000;
    this.timer = setInterval(() => this.tick(), intervalMs);
  }

  stop() {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  tick() {
    const now = this.ctx.currentTime;
    const stepIndex = this.step % 16;
    const hasSolo = this.soloing.size > 0;

    this.tracks.forEach((track) => {
      const audible = hasSolo ? track.solo : true;
      if (!track.enabled || !audible || track.muted || this.masterMuted) return;
      if (track.pattern[stepIndex]) {
        const when = now + this.lookahead;
        this.trigger(track, when);
      }
    });

    this.step = (this.step + 1) % 16;
  }

  trigger(track, when) {
    const gain = track.gainNode || this.createTrackGain(track.gain);
    track.gainNode = gain;
    switch (track.instrument) {
      case "kick":
        this.playKick(when, gain);
        break;
      case "snare":
        this.playSnare(when, gain);
        break;
      case "hat":
        this.playHat(when, gain);
        break;
      case "perc":
        this.playPerc(when, gain);
        break;
      case "bass":
        this.playBass(when, gain, track.root || 45);
        break;
      case "chord":
        this.playChord(when, gain, track.root || 57);
        break;
      case "voice":
        this.playVoice(when, gain);
        break;
      case "lead":
        this.playLead(when, gain, track.root || 72);
        break;
      case "sample":
        this.playSample(track.sampleBuffer, when, gain);
        break;
      default:
        break;
    }
  }

  setSample(id, buffer) {
    const t = this.tracks.find((tr) => tr.id === id);
    if (t) {
      t.sampleBuffer = buffer;
    }
  }

  playKick(time, gain) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(120, time);
    osc.frequency.exponentialRampToValueAtTime(50, time + 0.18);
    g.gain.setValueAtTime(1, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
    osc.connect(g).connect(gain);
    osc.start(time);
    osc.stop(time + 0.25);
  }

  playSnare(time, gain) {
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = "highpass";
    noiseFilter.frequency.value = 1800;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

    noise.connect(noiseFilter).connect(noiseGain).connect(gain);
    noise.start(time);
    noise.stop(time + 0.2);
  }

  playHat(time, gain) {
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const hp = this.ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 6000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.25, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
    noise.connect(hp).connect(g).connect(gain);
    noise.start(time);
    noise.stop(time + 0.1);
  }

  playPerc(time, gain) {
    const osc = this.ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(800, time);
    osc.frequency.exponentialRampToValueAtTime(200, time + 0.25);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.4, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
    osc.connect(g).connect(gain);
    osc.start(time);
    osc.stop(time + 0.3);
  }

  playBass(time, gain, midiRoot) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(500, time);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.001, time);
    g.gain.linearRampToValueAtTime(0.6, time + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
    osc.type = "sawtooth";
    osc.frequency.value = midiToFreq(midiRoot);
    osc.connect(filter).connect(g).connect(gain);
    osc.start(time);
    osc.stop(time + 0.45);
  }

  playChord(time, gain, midiRoot) {
    const intervals = [0, 3, 7]; // acorde menor
    intervals.forEach((i, idx) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const filt = this.ctx.createBiquadFilter();
      filt.type = "lowpass";
      filt.frequency.setValueAtTime(1200 - idx * 200, time);
      g.gain.setValueAtTime(0.001, time);
      g.gain.linearRampToValueAtTime(0.3, time + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, time + 1);
      osc.type = "triangle";
      osc.frequency.value = midiToFreq(midiRoot + i);
      osc.connect(filt).connect(g).connect(gain);
      osc.start(time);
      osc.stop(time + 1.2);
    });
  }

  playVoice(time, gain) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const filt = this.ctx.createBiquadFilter();
    osc.type = "sine";
    osc.frequency.value = 440;
    osc.frequency.exponentialRampToValueAtTime(330, time + 0.4);
    filt.type = "bandpass";
    filt.frequency.setValueAtTime(900, time);
    filt.Q.value = 5;
    g.gain.setValueAtTime(0.001, time);
    g.gain.linearRampToValueAtTime(0.4, time + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
    osc.connect(filt).connect(g).connect(gain);
    osc.start(time);
    osc.stop(time + 0.6);
  }

  playLead(time, gain, midiRoot) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.value = midiToFreq(midiRoot);
    g.gain.setValueAtTime(0.001, time);
    g.gain.linearRampToValueAtTime(0.25, time + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
    osc.connect(g).connect(gain);
    osc.start(time);
    osc.stop(time + 0.45);
  }

  playSample(buffer, time, gain) {
    if (!buffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(gain);
    src.start(time);
  }
}

const engine = new EduBoxEngine();

function midiToFreq(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

function getAllTracks() {
  return [...currentPack.tracks, ...customTracks];
}

function renderPacks() {
  ui.packSelect.innerHTML = "";
  packs.forEach((p) => {
    const option = document.createElement("option");
    option.value = p.id;
    option.textContent = `${p.name} · ${p.tempo} bpm`;
    ui.packSelect.appendChild(option);
  });
}

function renderTracks() {
  ui.trackGrid.innerHTML = "";
  getAllTracks().forEach((track) => {
    const card = document.createElement("article");
    card.className = "card";
    card.dataset.id = track.id;
    card.innerHTML = `
      <div class="card-header">
        <div class="avatar">${track.emoji}</div>
        <div>
          <div class="name">${track.name}</div>
          <div class="tags">${track.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>
        </div>
      </div>
      <div class="actions">
        <button class="toggle" data-action="toggle">Activar</button>
        <button class="toggle" data-action="solo">Solo</button>
      </div>
      <div class="mini">
        <span class="muted">Volumen</span>
        <div class="gain">
          <input type="range" min="0" max="1" step="0.01" value="${track.gain}">
        </div>
      </div>
      ${
        track.instrument === "sample"
          ? `<label class="upload">
              <span class="muted">Sube tu sample (WAV/OGG/MP3)</span>
              <input type="file" accept="audio/*" data-upload="sample">
              <span class="upload-status muted">${track.fileName ? `Cargado: ${track.fileName}` : "Sin sample"}</span>
             </label>`
          : ""
      }
    `;
    ui.trackGrid.appendChild(card);
  });
}

function attachCardEvents() {
  ui.trackGrid.addEventListener("click", (ev) => {
    const action = ev.target.dataset.action;
    if (!action) return;
    const card = ev.target.closest(".card");
    const id = card?.dataset.id;
    if (!id) return;
    if (action === "toggle") {
      engine.toggleTrack(id);
      ev.target.classList.toggle("active");
    }
    if (action === "solo") {
      engine.soloTrack(id);
      ev.target.classList.toggle("active");
    }
  });

  ui.trackGrid.addEventListener("input", (ev) => {
    if (ev.target.type !== "range") return;
    const card = ev.target.closest(".card");
    const id = card?.dataset.id;
    if (!id) return;
    engine.setGain(id, Number(ev.target.value));
  });

  ui.trackGrid.addEventListener("change", async (ev) => {
    if (ev.target.dataset.upload !== "sample") return;
    const card = ev.target.closest(".card");
    const id = card?.dataset.id;
    const file = ev.target.files?.[0];
    if (!id || !file) return;
    await loadUserSample(file, id, card);
  });
}

async function init() {
  renderPacks();
  ui.packDescription.textContent = currentPack.description;
  ui.packSelect.value = currentPack.id;
  ui.tempo.value = currentPack.tempo;
  ui.tempoValue.textContent = `${currentPack.tempo} bpm`;
  renderTracks();
  attachCardEvents();
  await setupServiceWorker();
}

async function startAudio() {
  await engine.ensureContext();
  engine.usePack(currentPack, customTracks);
}

function addCustomTrack() {
  if (customTracks.length >= MAX_CUSTOM) {
    alert("Límite de 10 samplers alcanzado.");
    return;
  }
  const idx = customTracks.length + 1;
  const track = {
    id: `user-${idx}`,
    name: `Sampler ${idx}`,
    emoji: "🎛️",
    tags: ["cargado por ti"],
    instrument: "sample",
    pattern: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    gain: 0.7,
    enabled: false,
    sampleBuffer: null,
    fileName: null
  };
  customTracks.push(track);
  renderTracks();
  if (engine.ctx) {
    engine.usePack(currentPack, customTracks);
  }
}

async function loadUserSample(file, trackId, card) {
  try {
    await startAudio();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await engine.ctx.decodeAudioData(arrayBuffer);
    engine.setSample(trackId, audioBuffer);
    const target = customTracks.find((t) => t.id === trackId);
    if (target) {
      target.sampleBuffer = audioBuffer;
      target.fileName = file.name;
    }
    const status = card.querySelector(".upload-status");
    if (status) {
      status.textContent = `Cargado: ${file.name}`;
    }
  } catch (err) {
    console.error("No se pudo cargar el sample", err);
    const status = card.querySelector(".upload-status");
    if (status) status.textContent = "Error al cargar el sample";
  }
}

async function setupServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("/service-worker.js");
    } catch (err) {
      // ok si falla en local
      console.warn("Service worker no disponible", err);
    }
  }
}

let deferredPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  ui.installPwa.style.display = "inline-flex";
});

ui.installPwa.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
});

ui.playToggle.addEventListener("click", async () => {
  await startAudio();
  if (!engine.isRunning) {
    engine.play();
    ui.playToggle.textContent = "⏸ Pausar";
  } else {
    engine.stop();
    ui.playToggle.textContent = "▶ Reproducir";
  }
});

ui.startAudio.addEventListener("click", async () => {
  await startAudio();
  ui.startAudio.textContent = "Audio listo";
});

ui.packSelect.addEventListener("change", async (e) => {
  const pack = packs.find((p) => p.id === e.target.value);
  currentPack = pack;
  ui.packDescription.textContent = pack.description;
  ui.tempo.value = pack.tempo;
  ui.tempoValue.textContent = `${pack.tempo} bpm`;
  renderTracks();
  if (engine.ctx) {
    engine.usePack(pack, customTracks);
  }
});

ui.tempo.addEventListener("input", (e) => {
  const bpm = Number(e.target.value);
  ui.tempoValue.textContent = `${bpm} bpm`;
  if (engine.ctx) {
    engine.setTempo(bpm);
  }
});

ui.muteAll.addEventListener("click", async () => {
  await startAudio();
  const mute = !engine.masterMuted;
  engine.muteAll(mute);
  ui.muteAll.textContent = mute ? "Quitar mute global" : "Mute global";
});

ui.stopAll.addEventListener("click", () => {
  engine.stop();
  engine.masterMuted = true;
  if (engine.master) engine.master.gain.value = 0;
  ui.playToggle.textContent = "▶ Reproducir";
});

ui.addSampler.addEventListener("click", () => {
  addCustomTrack();
});

init();
