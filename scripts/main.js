const ui = {
  trackGrid: document.getElementById("trackGrid"),
  playToggle: document.getElementById("playToggle"),
  tempo: document.getElementById("tempo"),
  tempoValue: document.getElementById("tempoValue"),
  startAudio: document.getElementById("startAudio"),
  installPwa: document.getElementById("installPwa"),
  muteAll: document.getElementById("muteAll"),
  stopAll: document.getElementById("stopAll"),
  addSampler: document.getElementById("addSampler"),
  slotSummary: document.getElementById("slotSummary"),
  swVersion: document.getElementById("swVersion")
};

const BASE_SLOTS = 5;
const MAX_SLOTS = 10;
const DEFAULT_TEMPO = 96;
const DEFAULT_LOOP_BARS = 4;
let globalLoopBars = DEFAULT_LOOP_BARS;
let sampleTracks = [];

class EduSamplerEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.noiseBuffer = null;
    this.tracks = [];
    this.tempo = DEFAULT_TEMPO;
    this.step = 0;
    this.isRunning = false;
    this.timer = null;
    this.lookahead = 0.08;
    this.soloing = new Set();
    this.masterMuted = false;
    this.nextBarTime = null;
    this.barInLoop = 0;
    this.loopBars = DEFAULT_LOOP_BARS;
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

  setTracks(tracks = []) {
    this.tracks = tracks.map((t) => {
      const existing = this.tracks?.find((tr) => tr.id === t.id);
      return {
        ...t,
        enabled: t.enabled || false,
        solo: t.solo || false,
        muted: t.muted || false,
        samplePlayingUntil: existing?.samplePlayingUntil || t.samplePlayingUntil || 0,
        isSamplePlaying: existing?.isSamplePlaying || t.isSamplePlaying || false,
        activeSource: existing?.activeSource || null,
        gainNode: existing?.gainNode || (this.ctx ? this.createTrackGain(t.gain) : null)
      };
    });
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

  setLoopBars(bars) {
    this.loopBars = Math.max(1, Math.round(bars || DEFAULT_LOOP_BARS));
  }

  toggleTrack(id) {
    const t = this.tracks.find((tr) => tr.id === id);
    if (!t) return;
    t.enabled = !t.enabled;
  }

  setTrackEnabled(id, enabled) {
    const t = this.tracks.find((tr) => tr.id === id);
    if (!t) return;
    t.enabled = enabled;
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

  setTrackSolo(id, solo) {
    const t = this.tracks.find((tr) => tr.id === id);
    if (!t) return;
    t.solo = solo;
    if (solo) {
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
    this.barInLoop = 0;
    this.nextBarTime = this.ctx.currentTime + this.lookahead;
    this.setLoopBars(globalLoopBars || DEFAULT_LOOP_BARS);
    const intervalMs = (60 / this.tempo / 4) * 1000;
    this.timer = setInterval(() => this.tick(), intervalMs);
  }

  stop() {
    this.isRunning = false;
    this.nextBarTime = null;
    this.barInLoop = 0;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  tick() {
    const now = this.ctx.currentTime;
    const stepIndex = this.step % 16;
    const hasSolo = this.soloing.size > 0;
    const barLength = this.getBarLengthSeconds();

    this.tracks.forEach((track) => {
      const audible = hasSolo ? track.solo : true;
      if (!track.enabled || !audible || track.muted || this.masterMuted) return;
      if (track.pattern[stepIndex]) {
        const when = this.nextBarTime || now + this.lookahead;
        this.trigger(track, when, stepIndex, barLength);
      }
    });

    if (stepIndex === 15) {
      this.nextBarTime = (this.nextBarTime || now) + barLength;
      this.barInLoop = (this.barInLoop + 1) % this.loopBars;
    }
    this.step = (this.step + 1) % 16;
  }

  trigger(track, when, stepIndex, barLength) {
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
        // Solo disparamos al inicio de cada compás para mantenerlos a tempo
        if (stepIndex === 0 && this.barInLoop === 0) {
          this.playSample(track, track.sampleBuffer, when, gain, barLength);
        }
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

  playSample(track, buffer, time, gain, barLength) {
    if (!buffer) return;
    const now = this.ctx.currentTime;
    const naturalDuration = buffer.duration || 0;
    const targetDuration = naturalDuration;
    const playbackRate = 1; // mantener tono/tempo originales

    // Si sigue sonando, esperamos a que termine antes de relanzar
    if (track.isSamplePlaying && now < (track.samplePlayingUntil || 0)) {
      return;
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = playbackRate || 1;
    src.connect(gain);
    track.isSamplePlaying = true;
    track.activeSource = src;
    track.samplePlayingUntil = time + targetDuration;
    src.onended = () => {
      track.samplePlayingUntil = 0;
      track.isSamplePlaying = false;
      track.activeSource = null;
    };
    src.start(time);
  }

  getBarLengthSeconds() {
    const secondsPerBeat = 60 / this.tempo;
    return secondsPerBeat * 4;
  }
}

const engine = new EduSamplerEngine();

function midiToFreq(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

function createEmptyTrack(idx) {
  return {
    id: `sample-${idx}`,
    name: `Sampler ${idx}`,
    emoji: "🎛️",
    tags: ["slot libre"],
    instrument: "sample",
    pattern: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // disparo al inicio del compás
    gain: 0.7,
    enabled: false,
    sampleBuffer: null,
    fileName: null,
    samplePlayingUntil: 0,
    isSamplePlaying: false,
    activeSource: null
  };
}


function ensureBaseSlots() {
  if (sampleTracks.length === 0) {
    for (let i = 1; i <= BASE_SLOTS; i++) {
      sampleTracks.push(createEmptyTrack(i));
    }
  }
}

function updateSwVersionLabel(text) {
  if (!ui.swVersion) return;
  ui.swVersion.textContent = text;
}

function barLengthFromTempo(tempo) {
  const secondsPerBeat = 60 / tempo;
  return secondsPerBeat * 4;
}

function recomputeLoopBars() {
  const tempo = engine?.tempo || DEFAULT_TEMPO;
  const barLength = barLengthFromTempo(tempo);
  const barsList = sampleTracks
    .filter((t) => t.sampleBuffer)
    .map((t) => Math.max(1, Math.round((t.sampleBuffer.duration || 0) / barLength)));
  globalLoopBars = barsList.length > 0 ? Math.min(...barsList) : DEFAULT_LOOP_BARS;
  engine.setLoopBars(globalLoopBars);
}

function renderTracks() {
  ui.trackGrid.innerHTML = "";
  sampleTracks.forEach((track) => {
    const tags = track.fileName ? ["listo para sonar"] : track.tags;
    const toggleClass = track.enabled ? "active" : "";
    const soloClass = track.solo ? "active" : "";
    const card = document.createElement("article");
    card.className = "card";
    card.dataset.id = track.id;
    card.innerHTML = `
      <div class="card-header">
        <div class="avatar">${track.emoji}</div>
        <div>
          <div class="name">${track.name}</div>
          <div class="tags">${tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>
        </div>
      </div>
      <div class="actions">
        <button class="toggle ${toggleClass}" data-action="toggle">Activar</button>
        <button class="toggle ${soloClass}" data-action="solo">Solo</button>
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
  renderSlotSummary();
}

function attachCardEvents() {
  ui.trackGrid.addEventListener("click", (ev) => {
    const action = ev.target.dataset.action;
    if (!action) return;
    const card = ev.target.closest(".card");
    const id = card?.dataset.id;
    if (!id) return;
    const track = sampleTracks.find((t) => t.id === id);
    if (!track) return;
    if (action === "toggle") {
      track.enabled = !track.enabled;
      if (engine.ctx) engine.setTrackEnabled(id, track.enabled);
      ev.target.classList.toggle("active", track.enabled);
    }
    if (action === "solo") {
      track.solo = !track.solo;
      if (engine.ctx) engine.setTrackSolo(id, track.solo);
      ev.target.classList.toggle("active", track.solo);
    }
  });

  ui.trackGrid.addEventListener("input", (ev) => {
    if (ev.target.type !== "range") return;
    const card = ev.target.closest(".card");
    const id = card?.dataset.id;
    if (!id) return;
    const track = sampleTracks.find((t) => t.id === id);
    if (!track) return;
    const value = Number(ev.target.value);
    track.gain = value;
    engine.setGain(id, value);
  });

  ui.trackGrid.addEventListener("change", async (ev) => {
    if (ev.target.dataset.upload !== "sample") return;
    const card = ev.target.closest(".card");
    const id = card?.dataset.id;
    const file = ev.target.files?.[0];
    if (!id || !file) return;
    await loadUserSample(file, id, card);
    renderTracks();
  });
}

async function init() {
  ensureBaseSlots();
  ui.tempo.value = DEFAULT_TEMPO;
  ui.tempoValue.textContent = `${DEFAULT_TEMPO} bpm`;
  renderTracks();
  renderSlotSummary();
  attachCardEvents();
  updateSwVersionLabel("SW: esperando...");
  await setupServiceWorker();
  await displaySwVersion();
}

async function startAudio() {
  await engine.ensureContext();
  engine.setTracks(sampleTracks);
}

function addCustomTrack() {
  if (sampleTracks.length >= MAX_SLOTS) {
    alert("Límite de 10 samplers alcanzado.");
    return;
  }
  const idx = sampleTracks.length + 1;
  const track = createEmptyTrack(idx);
  sampleTracks.push(track);
  renderTracks();
  if (engine.ctx) {
    engine.setTracks(sampleTracks);
  }
  renderSlotSummary();
}

async function loadUserSample(file, trackId, card) {
  try {
    await startAudio();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await engine.ctx.decodeAudioData(arrayBuffer);
    engine.setSample(trackId, audioBuffer);
    const target = sampleTracks.find((t) => t.id === trackId);
    if (target) {
      target.sampleBuffer = audioBuffer;
      target.fileName = file.name;
      target.tags = ["listo para sonar"];
    }
    recomputeLoopBars();
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

function renderSlotSummary() {
  if (!ui.slotSummary) return;
  const libres = MAX_SLOTS - sampleTracks.length;
  ui.slotSummary.textContent = `${sampleTracks.length} slots creados · ${libres} libres para añadir`;
}

async function setupServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.register("/service-worker.js");
      if (!navigator.serviceWorker.controller && reg.waiting) {
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
      }
    } catch (err) {
      // ok si falla en local
      console.warn("Service worker no disponible", err);
    }
  }
}

async function displaySwVersion() {
  if (!("serviceWorker" in navigator) || !ui.swVersion) {
    updateSwVersionLabel("SW: no disponible");
    return;
  }
  try {
    const registration = await navigator.serviceWorker.ready;
    const target = registration.active || navigator.serviceWorker.controller;
    if (!target) {
      updateSwVersionLabel("SW: no activo");
      return;
    }

    const handler = (event) => {
      if (event.data?.type === "SW_VERSION") {
        updateSwVersionLabel(`SW ${event.data.version}`);
        navigator.serviceWorker.removeEventListener("message", handler);
      }
    };

    navigator.serviceWorker.addEventListener("message", handler);
    target.postMessage({ type: "GET_VERSION" });
  } catch (err) {
    console.warn("No se pudo obtener la versión del SW", err);
    updateSwVersionLabel("SW: error");
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
  engine.muteAll(false);
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

ui.tempo.addEventListener("input", (e) => {
  const bpm = Number(e.target.value);
  ui.tempoValue.textContent = `${bpm} bpm`;
  if (engine.ctx) {
    engine.setTempo(bpm);
  }
  recomputeLoopBars();
});

ui.muteAll.addEventListener("click", async () => {
  await startAudio();
  const mute = !engine.masterMuted;
  engine.muteAll(mute);
  ui.muteAll.textContent = mute ? "Quitar mute global" : "Mute global";
});

ui.stopAll.addEventListener("click", () => {
  engine.stop();
  engine.muteAll(true);
  ui.playToggle.textContent = "▶ Reproducir";
});

ui.addSampler.addEventListener("click", () => {
  addCustomTrack();
});

init();
