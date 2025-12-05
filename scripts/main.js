const ui = {
  trackGrid: document.getElementById("trackGrid"),
  playToggle: document.getElementById("playToggle"),
  tempo: document.getElementById("tempo"),
  tempoValue: document.getElementById("tempoValue"),
  installPwa: document.getElementById("installPwa"),
  helpToggle: document.getElementById("helpToggle"),
  helpPanel: document.getElementById("helpPanel"),
  helpClose: document.getElementById("helpClose"),
  muteAll: document.getElementById("muteAll"),
  stopAll: document.getElementById("stopAll"),
  addSampler: document.getElementById("addSampler"),
  slotSummary: document.getElementById("slotSummary"),
  swVersion: document.getElementById("swVersion"),
  mixSelect: document.getElementById("mixSelect"),
  newMix: document.getElementById("newMix"),
  saveMix: document.getElementById("saveMix"),
  recordMix: document.getElementById("recordMix"),
  recordStatus: document.getElementById("recordStatus"),
  collapseCards: document.getElementById("collapseCards")
};

const BASE_SLOTS = 4;
const MAX_SLOTS = 10;
const DEFAULT_TEMPO = 96;
const DEFAULT_LOOP_BARS = 4;
let globalLoopBars = DEFAULT_LOOP_BARS;
const DEFAULT_GLOBAL_FACTOR = 1;
const DB_NAME = "edusampler-db";
const DB_VERSION = 1;
const DB_STORE = "samples";
let db = null;
let globalTempoFactor = DEFAULT_GLOBAL_FACTOR;
let savedMixes = [];
let sampleTracks = [];
let cardsCollapsed = true;
let currentLang = "es";
const trackRecorders = {};
const KEY_BINDINGS = {
  ArrowUp: 1,
  ArrowDown: 2,
  ArrowLeft: 3,
  ArrowRight: 4,
  Space: 5,
  KeyA: 6,
  KeyS: 7,
  KeyD: 8,
  KeyF: 9,
  KeyG: 10
};
const libraryCategories = [
  {
    id: "ritmos",
    labels: { es: "Ritmos", en: "Beats", ca: "Ritmes" },
    items: [
      { file: "samplers/ritmos/amen-break-no-copyright-remake-120bpm-25924.mp3", label: "Amen break 120" },
      { file: "samplers/ritmos/beat-addictive-percussive-rhythm-loop-120bpm-438642.mp3", label: "Perc loop 120" },
      { file: "samplers/ritmos/break-drum-loop-132276.mp3", label: "Break drum" },
      { file: "samplers/ritmos/cs-hihat-loop-01-128bpm.mp3", label: "Hi-hat loop 01" },
      { file: "samplers/ritmos/cs-hithat-loop-03-128bpm.mp3", label: "Hi-hat loop 03" },
      { file: "samplers/ritmos/cs-kick-04-d-128bpm.mp3", label: "Kick 04 D 128" },
      { file: "samplers/ritmos/hip-hop-drum-loop-main-beat-102-bpm-265600.mp3", label: "Hip-hop drum 102" },
      { file: "samplers/ritmos/kick-loop-short-16-140bpm-eminor-320605.mp3", label: "Kick loop 140 Em" },
      { file: "samplers/ritmos/typical-trap-loop-140bpm-129880.mp3", label: "Trap loop 140" }
    ]
  },
  {
    id: "melodias",
    labels: { es: "Melodías", en: "Melodies", ca: "Melodies" },
    items: [
      { file: "samplers/melodias/bells-melody-loop-266598.mp3", label: "Bells melody" },
      { file: "samplers/melodias/nostalgia-melody-loop-v1-264546.mp3", label: "Nostalgia melody" },
      { file: "samplers/melodias/pluck-loop-01-gminor-126bpm-405155.mp3", label: "Pluck 126 Gm 01" },
      { file: "samplers/melodias/pluck-loop-02-gminor-126bpm-405157.mp3", label: "Pluck 126 Gm 02" },
      { file: "samplers/melodias/pluck-loop-04-dminor-128bpm-405154.mp3", label: "Pluck 128 Dm 04" },
      { file: "samplers/melodias/pluck-loop-06-dmajor-120bpm-405151.mp3", label: "Pluck 120 Dmaj 06" },
      { file: "samplers/melodias/synth-loop-01-126bpm-gminor-320268.mp3", label: "Synth loop 126 Gm" },
      { file: "samplers/melodias/synth-loop-02-135bpm-fminor-320270.mp3", label: "Synth loop 135 Fm" },
      { file: "samplers/melodias/synth-loop-03-135bpm-dminor-320271.mp3", label: "Synth loop 135 Dm" }
    ]
  },
  {
    id: "guitarras",
    labels: { es: "Guitarras", en: "Guitars", ca: "Guitarres" },
    items: [
      { file: "samplers/guitarras/emotional-guitar-loop-02-301396.mp3", label: "Guitarra emocional" },
      { file: "samplers/guitarras/foo-fighters-type-guitar-loop-2-246591.mp3", label: "Guitarra Foo Fighters" },
      { file: "samplers/guitarras/hard-rock-guitar-loop-1-289431.mp3", label: "Guitarra hard rock" },
      { file: "samplers/guitarras/juice-wrld-x-marshmello-guitar-loop-246372.mp3", label: "Guitarra Juice WRLD" }
    ]
  },
  {
    id: "vocal",
    labels: { es: "Vocales", en: "Vocals", ca: "Vocals" },
    items: [
      { file: "samplers/vocal/angelic-voice-81921.mp3", label: "Voz angelical" },
      { file: "samplers/vocal/vocal-anthem-sha-loop-130bpm-272073.mp3", label: "Voz anthem 130" },
      { file: "samplers/vocal/vocal-loop-vocoder-36386.mp3", label: "Vocoder loop" },
      { file: "samplers/vocal/woman-vocal-gladiator-type-65610.mp3", label: "Voz gladiator" }
    ]
  },
  {
    id: "varios",
    labels: { es: "FX y varios", en: "FX & misc", ca: "FX i altres" },
    items: [
      { file: "samplers/varios/applause-crowd.mp3", label: "Aplauso" },
      { file: "samplers/varios/cs-fx-up-1-d-128bpm-258888.mp3", label: "FX subida 1" },
      { file: "samplers/varios/cs-fx-up-2-d-128bpm.mp3", label: "FX subida 2" },
      { file: "samplers/varios/happy-new-year.mp3", label: "Happy New Year" },
      { file: "samplers/varios/santaclaus_hohoho.mp3", label: "Santa Ho Ho Ho" }
    ]
  }
];

const librarySamples = libraryCategories.flatMap((category) => category.items.map((item) => ({ ...item, category: category.id })));

const translations = {
  es: {
    heroTitle: "Lanza tus samplers al instante",
    heroDesc: "Empieza con ranuras vacías, sube tus sonidos y actívalos juntos.",
    heroKicker: "Laboratorio de loops para clase de música",
    tempoLabel: "Tempo global (%)",
    record: "⏺ Grabar",
    recordStop: "⏹ Parar",
    recordStatusRecording: "Grabando mezcla...",
    recordStatusGenerating: "Generando archivo...",
    recordStatusReady: "Archivo listo",
    recordStatusError: "No se pudo grabar",
    recStart: "Grabar",
    recStop: "Parar",
    recIdle: "Listo para grabar",
    install: "Instalar",
    collapse: "Contraer",
    expand: "Expandir",
    helpBtn: "❓ Ayuda",
    helpTitle: "Atajos de teclado",
    helpClose: "Cerrar",
    helpEnter: "Intro / Enter",
    helpEnterDesc: "Reproducir o parar la mezcla",
    helpArrows: "Flechas ↑↓←→",
    helpArrowsDesc: "Activan los samplers 1, 2, 3 y 4",
    helpSpace: "Espacio",
    helpSpaceDesc: "Activa el sampler 5",
    helpLetters: "Teclas A S D F G",
    helpLettersDesc: "Activan los samplers 6, 7, 8, 9 y 10",
    helpHint: "Nota",
    helpHintDesc: "Las teclas se ignoran cuando escribes en un campo de texto",
    bankTitle: "Banco de samplers",
    samplerHint: "Arranca con 4 samplers vacíos y añade hasta 6 más cuando te queden cortos.",
    addSampler: "+ Añadir sampler",
    mixPlaceholder: "Cargar mezcla...",
    newMix: "Nueva mezcla",
    saveMix: "Guardar mezcla",
    slotsSummary: "{used} slots creados · {free} libres para añadir",
    muteAll: "🔊",
    unmuteAll: "🔇",
    stopAll: "⏹",
    play: "▶ Reproducir",
    pause: "⏸ Pausar",
    limit: "Límite de 10 samplers alcanzado.",
    uploadLabel: "Sube tu sample (WAV/OGG/MP3)",
    noSample: "Sin sample",
    loaded: "Cargado",
    libPlaceholder: "-- Selecciona un sampler --",
    libLabel: "Elegir de la biblioteca",
    nameLabel: "Nombre",
    volume: "Volumen",
    tempoTrack: "Tempo pista",
    loopStart: "Inicio (s)",
    loopEnd: "Fin (s)",
    waveHint: "Haz clic o arrastra para ajustar inicio/fin",
    statusError: "Error al cargar el sample",
    promptMix: "Nombre para esta mezcla:",
    btnActivate: "Activar",
    btnSolo: "Solo",
    tagEmpty: "slot libre",
  
  },
  ca: {
    heroTitle: "Llança els teus samplers al moment",
    heroDesc: "Comença amb ranures buides, puja els teus sons i activa'ls junts.",
    heroKicker: "Laboratori de loops per a classe de música",
    tempoLabel: "Tempo global (%)",
    record: "⏺ Grava",
    recordStop: "⏹ Para",
    recordStatusRecording: "Gravant mescla...",
    recordStatusGenerating: "Generant fitxer...",
    recordStatusReady: "Fitxer llest",
    recordStatusError: "No s'ha pogut gravar",
    recStart: "Grava",
    recStop: "Para",
    recIdle: "Llest per gravar",
    install: "Instal·la",
    recStart: "Grava",
    recStop: "Para",
    recIdle: "Llest per gravar",
    collapse: "Contreu",
    expand: "Expandeix",
    helpBtn: "❓ Ajuda",
    helpTitle: "Dreceres de teclat",
    helpClose: "Tanca",
    helpEnter: "Intro / Enter",
    helpEnterDesc: "Reprodueix o para la mescla",
    helpArrows: "Fletxes ↑↓←→",
    helpArrowsDesc: "Activen els samplers 1, 2, 3 i 4",
    helpSpace: "Espai",
    helpSpaceDesc: "Activa el sampler 5",
    helpLetters: "Tecles A S D F G",
    helpLettersDesc: "Activen els samplers 6, 7, 8, 9 i 10",
    helpHint: "Nota",
    helpHintDesc: "Les tecles s'ignoren quan escrius en un camp de text",
    bankTitle: "Banc de samplers",
    samplerHint: "Comença amb 4 samplers buits i afegeix-ne fins a 6 més quan et facen falta.",
    addSampler: "+ Afig sampler",
    mixPlaceholder: "Carrega mescla...",
    newMix: "Mescla nova",
    saveMix: "Guarda mescla",
    slotsSummary: "{used} slots creats · {free} lliures per afegir",
    muteAll: "🔊",
    unmuteAll: "🔇",
    stopAll: "⏹",
    play: "▶ Reproduir",
    pause: "⏸ Pausa",
    limit: "Límit de 10 samplers assolit.",
    uploadLabel: "Puja el teu sample (WAV/OGG/MP3)",
    noSample: "Sense sample",
    loaded: "Carregat",
    libPlaceholder: "-- Selecciona un sampler --",
    libLabel: "Tria de la biblioteca",
    nameLabel: "Nom",
    volume: "Volum",
    tempoTrack: "Tempo pista",
    loopStart: "Inici (s)",
    loopEnd: "Final (s)",
    waveHint: "Fes clic o arrossega per ajustar inici/final",
    statusError: "Error en carregar el sample",
    promptMix: "Nom per a esta mescla:",
    btnActivate: "Activa",
    btnSolo: "Solo",
    tagEmpty: "slot lliure",
    
  },
  en: {
    heroTitle: "Build your band in seconds",
    heroDesc: "Start with empty slots, drop your sounds, and trigger them together.",
    heroKicker: "Loop lab for music class",
    tempoLabel: "Global tempo (%)",
    record: "⏺ Record",
    recordStop: "⏹ Stop",
    recordStatusRecording: "Recording mix...",
    recordStatusGenerating: "Rendering file...",
    recordStatusReady: "File ready",
    recordStatusError: "Could not record",
    recStart: "Record",
    recStop: "Stop",
    recIdle: "Ready to record",
    install: "Install",
    recStart: "Record",
    recStop: "Stop",
    recIdle: "Ready to record",
    collapse: "Collapse",
    expand: "Expand",
    helpBtn: "❓ Help",
    helpTitle: "Keyboard shortcuts",
    helpClose: "Close",
    helpEnter: "Enter / Return",
    helpEnterDesc: "Play or stop the mix",
    helpArrows: "Arrow keys ↑↓←→",
    helpArrowsDesc: "Toggle samplers 1, 2, 3 and 4",
    helpSpace: "Spacebar",
    helpSpaceDesc: "Toggles sampler 5",
    helpLetters: "Keys A S D F G",
    helpLettersDesc: "Toggle samplers 6, 7, 8, 9 and 10",
    helpHint: "Note",
    helpHintDesc: "Keys are ignored while typing in a text field",
    bankTitle: "Sampler bank",
    samplerHint: "Start with 4 empty samplers and add up to 6 more if you need them.",
    addSampler: "+ Add sampler",
    mixPlaceholder: "Load mix...",
    newMix: "New mix",
    saveMix: "Save mix",
    slotsSummary: "{used} slots created · {free} free to add",
    muteAll: "🔊",
    unmuteAll: "🔇",
    stopAll: "⏹",
    play: "▶ Play",
    pause: "⏸ Pause",
    limit: "Limit of 10 samplers reached.",
    uploadLabel: "Upload your sample (WAV/OGG/MP3)",
    noSample: "No sample",
    loaded: "Loaded",
    libPlaceholder: "-- Select a sampler --",
    libLabel: "Choose from library",
    nameLabel: "Name",
    volume: "Volume",
    tempoTrack: "Track tempo",
    loopStart: "Start (s)",
    loopEnd: "End (s)",
    waveHint: "Click or drag to set start/end",
    statusError: "Error loading sample",
    promptMix: "Name this mix:",
    btnActivate: "Activate",
    btnSolo: "Solo",
    tagEmpty: "empty slot",
    about: "EduSampler by Samuel Soriano. MIT license. Included sounds come from Pixabay."
  }
};

function detectLanguage() {
  const stored = localStorage.getItem("edusampler-lang");
  if (stored) return stored;
  const nav = navigator.language || navigator.userLanguage || "es";
  if (nav.startsWith("ca")) return "ca";
  if (nav.startsWith("en")) return "en";
  return "es";
}

function t(key, params = {}) {
  const langPack = translations[currentLang] || translations.es;
  let str = langPack[key] || translations.es[key] || key;
  Object.entries(params).forEach(([k, v]) => {
    str = str.replace(new RegExp(`{${k}}`, "g"), v);
  });
  return str;
}


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
    this.globalTempoFactor = DEFAULT_GLOBAL_FACTOR;
    this.recorderDest = null;
    this.recorder = null;
    this.recording = false;
    this.recordedChunks = [];
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
      // trabajamos sobre la misma referencia para que los cambios de loop se reflejen
      const track = t;
      track.enabled = Boolean(track.enabled);
      track.solo = Boolean(track.solo);
      track.muted = Boolean(track.muted);
      track.samplePlayingUntil = track.samplePlayingUntil ?? 0;
      track.isSamplePlaying = track.isSamplePlaying ?? false;
      track.activeSource = track.activeSource ?? null;
      track.loopStart = track.loopStart ?? 0;
      track.loopEnd = track.loopEnd ?? null;
      track.waveform = track.waveform ?? null;
      track.tempoFactor = Number.isFinite(track.tempoFactor) ? track.tempoFactor : 1;
      track.collapsed = Boolean(track.collapsed);
      track.expandedOverride = Boolean(track.expandedOverride);
      track.pausedBySolo = Boolean(track.pausedBySolo);
      if (!track.gainNode && this.ctx) {
        track.gainNode = this.createTrackGain(track.gain);
      }
      return track;
    });
    // reconstruimos el set de solo según el estado actual de las pistas
    this.soloing = new Set(this.tracks.filter((t) => t.solo).map((t) => t.id));
    this.applySoloState();
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

  setGlobalTempoFactor(factor) {
    this.globalTempoFactor = factor || DEFAULT_GLOBAL_FACTOR;
  }

  toggleTrack(id) {
    const t = this.tracks.find((tr) => tr.id === id);
    if (!t) return;
    t.enabled = !t.enabled;
    if (!t.enabled) {
      this.stopTrackPlayback(t);
    }
  }

  setTrackEnabled(id, enabled) {
    const t = this.tracks.find((tr) => tr.id === id);
    if (!t) return;
    t.enabled = enabled;
    if (!enabled) {
      this.stopTrackPlayback(t);
      return;
    }
    // reset estado de loop al reactivar
    t.samplePlayingUntil = 0;
    t.isSamplePlaying = false;
    t.activeSource = null;
    if (this.isRunning && this.ctx) {
      const gain = t.gainNode || this.createTrackGain(t.gain);
      t.gainNode = gain;
      if (t.instrument === "sample" && t.sampleBuffer) {
        const when = (this.nextBarTime || this.ctx.currentTime) + this.lookahead;
        const barLength = this.getBarLengthSeconds();
        this.playSample(t, t.sampleBuffer, when, gain, barLength);
      }
    }
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
    const nextSolo = !t.solo;
    // si activamos solo, desactivamos otros solos y limpiamos set
    if (nextSolo) {
      this.tracks.forEach((tr) => {
        tr.solo = tr.id === id;
      });
      this.soloing.clear();
      this.soloing.add(id);
    } else {
      // si se desactiva, queda sin solos
      this.tracks.forEach((tr) => (tr.solo = false));
      this.soloing.clear();
    }
    this.applySoloState();
  }

  setTrackSolo(id, solo) {
    const t = this.tracks.find((tr) => tr.id === id);
    if (!t) return;
    if (solo) {
      this.tracks.forEach((tr) => (tr.solo = tr.id === id));
      this.soloing.clear();
      this.soloing.add(id);
    } else {
      this.tracks.forEach((tr) => (tr.solo = false));
      this.soloing.clear();
    }
    this.applySoloState();
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
    this.tracks.forEach((t) => this.stopTrackPlayback(t));
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
    markTrackPlaying(track.id);
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
    const loopStart = Math.max(0, Math.min(track.loopStart || 0, naturalDuration));
    const loopEndRaw = track.loopEnd ?? naturalDuration;
    const loopEnd = Math.min(Math.max(loopEndRaw, loopStart + 0.01), naturalDuration);
    const playDuration = loopEnd - loopStart;
    const baseRate = 1; // mantener velocidad original del sample
    const playbackRate = baseRate * (track.tempoFactor || 1) * (this.globalTempoFactor || 1);

    // Si sigue sonando, dejamos que continúe (looping continuo)
    if (track.isSamplePlaying && now < (track.samplePlayingUntil || 0)) {
      return;
    }

    // Si hubiera una fuente previa viva, la detenemos
    resetTrackPlayback(track);

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = playbackRate || 1;
    src.loop = true;
    src.loopStart = loopStart;
    src.loopEnd = loopEnd;
    src.connect(gain);
    track.isSamplePlaying = true;
    track.activeSource = src;
    // uso Infinity para indicar que está en loop continuo
    track.samplePlayingUntil = Number.POSITIVE_INFINITY;
    src.onended = () => {
      track.samplePlayingUntil = 0;
      track.isSamplePlaying = false;
      track.activeSource = null;
    };
    src.start(time, loopStart);
  }

  getBarLengthSeconds() {
    const secondsPerBeat = 60 / this.tempo;
    return secondsPerBeat * 4;
  }

  stopTrackPlayback(track, { fadeOut = true } = {}) {
    if (!track) return;
    const source = track.activeSource;
    if (source) {
      const gainNode = track.gainNode;
      if (fadeOut && this.ctx && gainNode?.gain) {
        const now = this.ctx.currentTime;
        const fadeTime = 0.55;
        const gainParam = gainNode.gain;
        const currentValue = gainParam.value;
        gainParam.cancelScheduledValues(now);
        gainParam.setValueAtTime(currentValue, now);
        gainParam.linearRampToValueAtTime(0.0001, now + fadeTime);
        try {
          source.stop(now + fadeTime + 0.01);
        } catch (err) {
          // ignore
        }
        const targetGain = Number.isFinite(track.gain) ? track.gain : currentValue;
        gainParam.setValueAtTime(targetGain, now + fadeTime + 0.02);
      } else {
        try {
          source.stop();
        } catch (err) {
          // ignore
        }
      }
    }
    track.activeSource = null;
    track.isSamplePlaying = false;
    track.samplePlayingUntil = 0;
  }

  applySoloState() {
    const hasSolo = this.soloing.size > 0;
    if (hasSolo) {
      this.tracks.forEach((tr) => {
        if (tr.solo) {
          tr.pausedBySolo = false;
          return;
        }
        this.stopTrackPlayback(tr);
        tr.pausedBySolo = true;
      });
      return;
    }

    if (!this.ctx || !this.isRunning) {
      this.tracks.forEach((tr) => (tr.pausedBySolo = false));
      return;
    }

    const when = (this.nextBarTime || this.ctx.currentTime) + this.lookahead;
    const barLength = this.getBarLengthSeconds();
    this.tracks.forEach((tr) => {
      if (!tr.pausedBySolo) return;
      tr.pausedBySolo = false;
      if (!tr.enabled || tr.muted || this.masterMuted) return;
      const gain = tr.gainNode || this.createTrackGain(tr.gain);
      tr.gainNode = gain;
      if (tr.instrument === "sample" && tr.sampleBuffer) {
        this.playSample(tr, tr.sampleBuffer, when, gain, barLength);
        return;
      }
      const firstStep = tr.pattern?.findIndex(Boolean);
      if (firstStep >= 0) {
        this.trigger(tr, when, firstStep, barLength);
      }
    });
  }

  ensureRecorderDestination() {
    if (!this.ctx) return null;
    if (!this.recorderDest) {
      this.recorderDest = this.ctx.createMediaStreamDestination();
      this.master.connect(this.recorderDest);
    }
    return this.recorderDest;
  }

  startRecording() {
    if (!this.ctx) return null;
    const dest = this.ensureRecorderDestination();
    if (!dest) return null;
    this.recordedChunks = [];
    this.recorder = new MediaRecorder(dest.stream);
    this.recording = true;
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.recordedChunks.push(e.data);
      }
    };
    this.recorder.start();
    return true;
  }

  stopRecording() {
    return new Promise((resolve) => {
      if (!this.recorder || !this.recording) return resolve(null);
      this.recorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: "audio/webm" });
        this.recording = false;
        this.recorder = null;
        resolve(blob);
      };
      this.recorder.stop();
    });
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
    activeSource: null,
    loopStart: 0,
    loopEnd: null,
    waveform: null,
    displayName: `Sampler ${idx}`,
    tempoFactor: 1,
    collapsed: false,
    expandedOverride: false,
    pausedBySolo: false
  };
}

function getCategoryLabel(categoryIdOrObj) {
  const category =
    typeof categoryIdOrObj === "string"
      ? libraryCategories.find((c) => c.id === categoryIdOrObj)
      : categoryIdOrObj;
  if (!category) return categoryIdOrObj || "";
  const labels = category.labels || {};
  return labels[currentLang] || labels.es || labels.en || category.id;
}

function getLibraryLabel(track, withCategory = false) {
  if (!track?.fileName) return null;
  const match = librarySamples.find((l) => l.file.endsWith(track.fileName));
  if (!match) return null;
  if (withCategory && match.category) {
    const categoryLabel = getCategoryLabel(match.category);
    return `${categoryLabel} · ${match.label}`;
  }
  return match.label;
}


function ensureBaseSlots() {
  if (sampleTracks.length === 0) {
    for (let i = 1; i <= BASE_SLOTS; i++) {
      sampleTracks.push(createEmptyTrack(i));
    }
  }
}

function ensureTrackExistsByIndex(index) {
  if (index <= 0 || index > MAX_SLOTS) return null;
  while (sampleTracks.length < index && sampleTracks.length < MAX_SLOTS) {
    sampleTracks.push(createEmptyTrack(sampleTracks.length + 1));
  }
  renderTracks();
  syncEngineTracks();
  renderSlotSummary();
  return sampleTracks[index - 1] || null;
}

function updateSwVersionLabel(text) {
  if (!ui.swVersion) return;
  ui.swVersion.textContent = text;
}

function isPwaInstalled() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function hideInstallButton() {
  if (ui.installPwa) {
    ui.installPwa.style.display = "none";
  }
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
    .map((t) => {
      const dur = getLoopDuration(t);
      return Math.max(1, Math.round(dur / barLength));
    });
  globalLoopBars = barsList.length > 0 ? Math.min(...barsList) : DEFAULT_LOOP_BARS;
  engine.setLoopBars(globalLoopBars);
}

function getLoopDuration(track) {
  const bufferDur = track.sampleBuffer?.duration || 0;
  const start = Math.max(0, Math.min(track.loopStart || 0, bufferDur));
  const endRaw = track.loopEnd ?? bufferDur;
  const end = Math.min(Math.max(endRaw, start + 0.01), bufferDur);
  return Math.max(0.01, end - start);
}

function updateLoopPoints(track, type, value) {
  const bufferDur = track.sampleBuffer?.duration || 0;
  const safeVal = Number.isFinite(value) && value >= 0 ? value : 0;
  if (type === "start") {
    track.loopStart = Math.min(safeVal, bufferDur);
    if (track.loopEnd !== null && track.loopEnd <= track.loopStart) {
      track.loopEnd = bufferDur || track.loopStart + 0.5;
    }
  }
  if (type === "end") {
    const endCandidate = Math.min(safeVal || bufferDur, bufferDur || safeVal);
    track.loopEnd = endCandidate || bufferDur;
    if (track.loopEnd <= track.loopStart) {
      track.loopEnd = Math.min(bufferDur || track.loopStart + 0.5, track.loopStart + 0.5);
    }
  }
  recomputeLoopBars();
  resetTrackPlayback(track);
  syncEngineTracks();
  saveStateMeta();
  return { start: track.loopStart, end: track.loopEnd };
}

function syncEngineTracks() {
  if (engine.ctx) {
    engine.setTracks(sampleTracks);
  }
}

function resetTrackPlayback(track) {
  if (!track) return;
  if (engine?.stopTrackPlayback) {
    engine.stopTrackPlayback(track, { fadeOut: false });
  } else {
    if (track.activeSource) {
      try {
        track.activeSource.stop();
      } catch (err) {
        // ok si ya no suena
      }
    }
    track.activeSource = null;
    track.isSamplePlaying = false;
    track.samplePlayingUntil = 0;
  }
  const engTrack = engine?.tracks?.find((t) => t.id === track.id);
  if (engTrack && engTrack !== track) {
    if (engine?.stopTrackPlayback) {
      engine.stopTrackPlayback(engTrack, { fadeOut: false });
    } else if (engTrack.activeSource) {
      try {
        engTrack.activeSource.stop();
      } catch (err) {
        // ignore
      }
      engTrack.activeSource = null;
      engTrack.isSamplePlaying = false;
      engTrack.samplePlayingUntil = 0;
    }
  }
}

function buildWaveform(buffer, slices = 400) {
  const data = buffer.getChannelData(0);
  const step = Math.max(1, Math.floor(data.length / slices));
  const points = [];
  for (let i = 0; i < data.length; i += step) {
    const slice = data.subarray(i, i + step);
    let min = 1;
    let max = -1;
    for (let j = 0; j < slice.length; j++) {
      const v = slice[j];
      if (v < min) min = v;
      if (v > max) max = v;
    }
    points.push({ min, max });
  }
  return points;
}

function drawWaveform(canvas, track) {
  if (!canvas || !track || !track.sampleBuffer) return;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  const mid = height / 2;
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(0, mid - 1, width, 2);

  const points = track.waveform || buildWaveform(track.sampleBuffer);
  track.waveform = points;
  ctx.strokeStyle = "rgba(244, 179, 36, 0.8)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  points.forEach((p, idx) => {
    const x = (idx / points.length) * width;
    const y1 = mid + p.min * mid;
    const y2 = mid + p.max * mid;
    ctx.moveTo(x, y1);
    ctx.lineTo(x, y2);
  });
  ctx.stroke();

  // overlay de selección
  const dur = track.sampleBuffer.duration || 1;
  const startRatio = (track.loopStart || 0) / dur;
  const endRatio = (track.loopEnd ?? dur) / dur;
  const selX = startRatio * width;
  const selW = Math.max(2, (endRatio - startRatio) * width);
  ctx.fillStyle = "rgba(48, 191, 179, 0.18)";
  ctx.fillRect(selX, 0, selW, height);

  // asas
  ctx.fillStyle = "#f4b324";
  ctx.fillRect(selX - 2, 0, 4, height);
  ctx.fillRect(selX + selW - 2, 0, 4, height);
}

function drawAllWaveforms() {
  requestAnimationFrame(() => {
    document.querySelectorAll("[data-wave-canvas]").forEach((canvasEl) => {
      const id = canvasEl.dataset.waveCanvas;
      const track = sampleTracks.find((t) => t.id === id);
      if (track) drawWaveform(canvasEl, track);
    });
  });
}

function markTrackPlaying(trackId) {
  const card = ui.trackGrid.querySelector(`.card[data-id="${trackId}"]`);
  if (!card) return;
  card.classList.add("playing");
  setTimeout(() => {
    card.classList.remove("playing");
  }, 200);
}

function isTrackRecording(id) {
  return Boolean(trackRecorders[id]);
}

async function startTrackRecording(trackId, card) {
  if (!navigator.mediaDevices?.getUserMedia) {
    updateRecStatus(card, t("statusError"));
    return;
  }
  if (trackRecorders[trackId]) {
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    trackRecorders[trackId] = { recorder, chunks: [], stream };
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) trackRecorders[trackId].chunks.push(e.data);
    };
    recorder.start();
    updateRecStatus(card, t("recordStatusRecording"));
  } catch (err) {
    console.error("No se pudo iniciar grabación", err);
    updateRecStatus(card, t("recordStatusError"));
  }
}

async function stopTrackRecording(trackId, card) {
  const state = trackRecorders[trackId];
  if (!state) return;
  return new Promise((resolve) => {
    state.recorder.onstop = async () => {
      const blob = new Blob(state.chunks, { type: "audio/webm" });
      state.stream.getTracks().forEach((tr) => tr.stop());
      delete trackRecorders[trackId];
      await loadRecordedSample(blob, trackId, card);
      resolve();
    };
    state.recorder.stop();
  });
}

async function loadRecordedSample(blob, trackId, card) {
  try {
    await startAudio();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await engine.ctx.decodeAudioData(arrayBuffer.slice(0));
    engine.setSample(trackId, audioBuffer);
    const target = sampleTracks.find((t) => t.id === trackId);
    if (target) {
      target.sampleBuffer = audioBuffer;
      target.fileName = `grab-${trackId}.webm`;
      target.tags = [t("loaded")];
      target.loopStart = 0;
      target.loopEnd = audioBuffer.duration;
      target.waveform = buildWaveform(audioBuffer);
      const file = new File([blob], target.fileName, { type: blob.type || "audio/webm" });
      await saveSampleToDb(target, file);
    }
    updateRecStatus(card, t("recordStatusReady"));
    renderTracks();
    drawAllWaveforms();
  } catch (err) {
    console.error("No se pudo cargar grabación", err);
    updateRecStatus(card, t("statusError"));
  }
}

function updateRecStatus(card, text) {
  const statusEl = card?.querySelector("[data-record-status]");
  if (statusEl) statusEl.textContent = text;
}

function applyTranslations() {
  document.documentElement.lang = currentLang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (!key) return;
    el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-label]").forEach((el) => {
    const key = el.dataset.i18nLabel;
    if (!key) return;
    el.setAttribute("aria-label", t(key));
    el.setAttribute("title", t(key));
  });
  if (ui.playToggle) ui.playToggle.textContent = engine.isRunning ? t("pause") : t("play");
  if (ui.recordMix) ui.recordMix.textContent = engine.recording ? t("recordStop") : t("record");
  if (ui.collapseCards) ui.collapseCards.textContent = cardsCollapsed ? t("expand") : t("collapse");
  if (ui.muteAll) ui.muteAll.textContent = engine.masterMuted ? t("unmuteAll") : t("muteAll");
  renderMixSelect();
  renderTracks();
  drawAllWaveforms();
  renderSlotSummary();
  const langSelect = document.getElementById("langSelect");
  if (langSelect) langSelect.value = currentLang;
}

// ---------- Persistencia (IndexedDB + localStorage) ----------
async function initDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const dbInstance = event.target.result;
      if (!dbInstance.objectStoreNames.contains(DB_STORE)) {
        dbInstance.createObjectStore(DB_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => {
      db = request.result;
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

function saveStateMeta() {
  const meta = sampleTracks.map(({ id, displayName, fileName, loopStart, loopEnd, enabled, tempoFactor, collapsed }) => ({
    id,
    displayName,
    fileName,
    loopStart,
    loopEnd,
    enabled,
    tempoFactor: tempoFactor ?? 1,
    collapsed: Boolean(collapsed)
  }));
  localStorage.setItem("edusampler-meta", JSON.stringify(meta));
}

function loadMixesFromStorage() {
  try {
    const raw = localStorage.getItem("edusampler-mixes");
    savedMixes = raw ? JSON.parse(raw) : [];
  } catch (err) {
    savedMixes = [];
  }
}

function persistMixes() {
  localStorage.setItem("edusampler-mixes", JSON.stringify(savedMixes));
}

function saveCurrentMix(name) {
  const meta = sampleTracks.map((t) => ({
    id: t.id,
    displayName: t.displayName,
    fileName: t.fileName,
    loopStart: t.loopStart,
    loopEnd: t.loopEnd,
    enabled: t.enabled,
    tempoFactor: t.tempoFactor ?? 1,
    collapsed: Boolean(t.collapsed)
  }));
  const mix = {
    id: `${Date.now()}`,
    name: name || t("saveMix"),
    date: Date.now(),
    globalTempoFactor: globalTempoFactor,
    tracks: meta
  };
  savedMixes.unshift(mix);
  savedMixes = savedMixes.slice(0, 10); // mantener las 10 últimas
  persistMixes();
  renderMixSelect();
  ui.mixSelect.value = mix.id;
}

async function loadMixById(id) {
  const mix = savedMixes.find((m) => m.id === id);
  if (!mix) return;
  globalTempoFactor = mix.globalTempoFactor || DEFAULT_GLOBAL_FACTOR;
  localStorage.setItem("edusampler-global-tempo", String(globalTempoFactor));
  ui.tempo.value = Math.round(globalTempoFactor * 100);
  ui.tempoValue.textContent = `${Math.round(globalTempoFactor * 100)}%`;

  for (const m of mix.tracks) {
    let track = sampleTracks.find((t) => t.id === m.id);
    if (!track) {
      if (sampleTracks.length >= MAX_SLOTS) break;
      track = createEmptyTrack(sampleTracks.length + 1);
      track.id = m.id;
      sampleTracks.push(track);
    }
    track.displayName = m.displayName || track.displayName;
    track.fileName = m.fileName || track.fileName;
    track.loopStart = m.loopStart ?? track.loopStart;
    track.loopEnd = m.loopEnd ?? track.loopEnd;
    track.enabled = m.enabled ?? track.enabled;
    track.tempoFactor = Number.isFinite(m.tempoFactor) ? m.tempoFactor : track.tempoFactor;
    // recuperar audio si existe en DB
    if (!track.sampleBuffer) {
      const recs = await readAllSamples();
      const rec = recs.find((r) => r.id === track.id);
      if (rec?.data) {
        const audioBuffer = await decodeArrayBuffer(rec.data);
        track.sampleBuffer = audioBuffer;
        track.waveform = buildWaveform(audioBuffer);
      }
    }
  }
  renderTracks();
  drawAllWaveforms();
  renderSlotSummary();
  syncEngineTracks();
}

function startNewMix() {
  engine.stop();
  cardsCollapsed = true;
  if (ui.collapseCards) ui.collapseCards.textContent = t("expand");
  globalLoopBars = DEFAULT_LOOP_BARS;
  globalTempoFactor = DEFAULT_GLOBAL_FACTOR;
  ui.tempo.value = Math.round(globalTempoFactor * 100);
  ui.tempoValue.textContent = `${Math.round(globalTempoFactor * 100)}%`;
  sampleTracks = [];
  ensureBaseSlots();
  if (ui.mixSelect) ui.mixSelect.value = "";
  renderTracks();
  drawAllWaveforms();
  renderSlotSummary();
  engine.setGlobalTempoFactor(globalTempoFactor);
  syncEngineTracks();
  saveStateMeta();
  localStorage.setItem("edusampler-global-tempo", String(globalTempoFactor));
}

async function saveSampleToDb(track, file) {
  if (!db || !track || !file) return;
  const buffer = await file.arrayBuffer();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readwrite");
    const store = tx.objectStore(DB_STORE);
    const record = {
      id: track.id,
      name: track.displayName || track.name,
      fileName: file.name,
      loopStart: track.loopStart,
      loopEnd: track.loopEnd,
      data: buffer
    };
    store.put(record);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function restoreSamplesFromDb() {
  try {
    const metaRaw = localStorage.getItem("edusampler-meta");
    const meta = metaRaw ? JSON.parse(metaRaw) : [];
    if (!db) return;
    const records = await readAllSamples();
    // asignar metadatos y buffers a slots existentes o crear nuevos
    for (const m of meta) {
      let track = sampleTracks.find((t) => t.id === m.id);
      if (!track) {
        if (sampleTracks.length >= MAX_SLOTS) break;
        track = createEmptyTrack(sampleTracks.length + 1);
        track.id = m.id;
        sampleTracks.push(track);
      }
      track.displayName = m.displayName || track.displayName;
      track.fileName = m.fileName || track.fileName;
      track.loopStart = m.loopStart ?? track.loopStart;
      track.loopEnd = m.loopEnd ?? track.loopEnd;
      track.enabled = m.enabled ?? track.enabled;
      track.tempoFactor = Number.isFinite(m.tempoFactor) ? m.tempoFactor : track.tempoFactor;
      track.collapsed = Boolean(m.collapsed);
      const rec = records.find((r) => r.id === m.id);
      if (rec?.data) {
        const audioBuffer = await decodeArrayBuffer(rec.data);
        track.sampleBuffer = audioBuffer;
        track.waveform = buildWaveform(audioBuffer);
      }
    }
    syncEngineTracks();
  } catch (err) {
    console.warn("No se pudieron restaurar samples", err);
  }
}

function readAllSamples() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, "readonly");
    const store = tx.objectStore(DB_STORE);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function decodeArrayBuffer(buffer) {
  const ctx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 44100, 44100);
  return ctx.decodeAudioData(buffer.slice(0));
}

function renderTracks() {
  ui.trackGrid.innerHTML = "";
  sampleTracks.forEach((track) => {
    const tags = track.fileName ? [`${t("loaded")}: ${track.fileName}`] : [t("tagEmpty")];
    const toggleClass = track.enabled ? "active" : "";
    const soloClass = track.solo ? "active" : "";
    const card = document.createElement("article");
    const collapsed = cardsCollapsed ? !track.expandedOverride : track.collapsed;
    card.className = `card${collapsed ? " collapsed" : ""}`;
    card.dataset.id = track.id;
    const recLabel = isTrackRecording(track.id) ? t("recStop") : t("recStart");
    card.innerHTML = `
      <div class="card-header">
        <div class="avatar">${track.emoji}</div>
        <div>
          <div class="tags">${tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>
        </div>
      </div>
      <div class="name-edit-inline" data-inline-name>
        <input id="name-${track.id}" type="text" maxlength="40" value="${track.displayName || track.name}" aria-label="${t("nameLabel")}">
      </div>
      <div class="actions">
        <button class="toggle ${toggleClass}" data-action="toggle">${t("btnActivate")}</button>
        <button class="toggle ${soloClass}" data-action="solo">${t("btnSolo")}</button>
        <button class="toggle" data-action="collapse">${collapsed ? t("expand") : t("collapse")}</button>
      </div>
      ${
        track.instrument === "sample"
          ? `<div class="mini library-picker">
               <label class="muted" for="lib-${track.id}">${t("libLabel")}</label>
               <select id="lib-${track.id}" data-library="sample">
                 <option value="">${t("libPlaceholder")}</option>
                 ${libraryCategories
                   .map(
                     (category) =>
                       `<optgroup label="${getCategoryLabel(category)}">
                          ${category.items
                            .map(
                              (l) =>
                                `<option value="${l.file}" ${track.fileName && l.file.endsWith(track.fileName) ? "selected" : ""}>${l.label}</option>`
                            )
                            .join("")}
                        </optgroup>`
                   )
                   .join("")}
               </select>
               <div class="library-status muted">${getLibraryLabel(track, true) || track.fileName || t("noSample")}</div>
             </div>`
          : ""
      }
      <div class="mini">
        <span class="muted">${t("volume")}</span>
        <div class="gain">
          <input type="range" min="0" max="1" step="0.01" value="${track.gain}">
        </div>
      </div>
      <div class="mini">
        <span class="muted">${t("tempoTrack")}</span>
        <div class="gain">
          <input type="range" min="0.5" max="1.5" step="0.05" value="${track.tempoFactor || 1}" data-loop="tempo">
          <span class="muted">${Math.round((track.tempoFactor || 1) * 100)}%</span>
        </div>
      </div>
      <div class="mini recorder">
        <div class="rec-controls">
          <button class="toggle" data-action="rec-toggle">${recLabel}</button>
        </div>
        <span class="muted record-status" data-record-status>${t("recIdle") || "Listo para grabar"}</span>
      </div>
      ${
        track.instrument === "sample"
          ? `<label class="upload">
              <span class="muted">${t("uploadLabel")}</span>
              <input type="file" accept="audio/*" data-upload="sample">
              <span class="upload-status muted">${track.fileName ? `${t("loaded")}: ${track.fileName}` : t("noSample")}</span>
             </label>
             <div class="mini loop-editor">
               <div class="loop-field">
                 <label class="muted" for="loop-start-${track.id}">${t("loopStart")}</label>
                 <input id="loop-start-${track.id}" type="number" min="0" step="0.1" value="${track.loopStart ?? 0}" data-loop="start">
               </div>
               <div class="loop-field">
                 <label class="muted" for="loop-end-${track.id}">${t("loopEnd")}</label>
                 <input id="loop-end-${track.id}" type="number" min="0" step="0.1" value="${track.loopEnd ?? ""}" placeholder="${track.sampleBuffer ? track.sampleBuffer.duration.toFixed(1) : ""}" data-loop="end">
               </div>
             </div>
             ${
               track.sampleBuffer
                 ? `<div class="wave-container" data-wave="${track.id}">
                      <canvas data-wave-canvas="${track.id}" width="600" height="110"></canvas>
                      <div class="wave-meta muted">${t("waveHint")}</div>
                    </div>`
                 : ""
             }`
          : ""
      }
    `;
    ui.trackGrid.appendChild(card);
  });
  renderSlotSummary();
  drawAllWaveforms();
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
      // actualizar todos los botones solo para reflejar exclusividad
      ui.trackGrid.querySelectorAll('[data-action="solo"]').forEach((btn) => {
        const bCard = btn.closest(".card");
        const bid = bCard?.dataset.id;
        const bTrack = sampleTracks.find((t) => t.id === bid);
        btn.classList.toggle("active", bTrack?.solo);
      });
    }
    if (action === "collapse") {
      if (cardsCollapsed) {
        const nextCollapsed = !card.classList.contains("collapsed");
        track.expandedOverride = !nextCollapsed;
        card.classList.toggle("collapsed", nextCollapsed);
        ev.target.textContent = nextCollapsed ? t("expand") : t("collapse");
      } else {
        track.collapsed = !track.collapsed;
        card.classList.toggle("collapsed", track.collapsed);
        ev.target.textContent = track.collapsed ? t("expand") : t("collapse");
      }
    }
    if (action === "rec-toggle") {
      if (isTrackRecording(id)) {
        stopTrackRecording(id, card);
        ev.target.textContent = t("recStart");
      } else {
        startTrackRecording(id, card);
        ev.target.textContent = t("recStop");
      }
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
    if (ev.target.dataset.loop === "tempo") {
      track.tempoFactor = value;
      ev.target.nextElementSibling.textContent = `${Math.round(value * 100)}%`;
    } else {
      track.gain = value;
      engine.setGain(id, value);
    }
  });

  ui.trackGrid.addEventListener("input", (ev) => {
    if (ev.target.type !== "text") return;
    const card = ev.target.closest(".card");
    const id = card?.dataset.id;
    if (!id) return;
    const track = sampleTracks.find((t) => t.id === id);
    if (!track) return;
    track.displayName = ev.target.value.slice(0, 40);
    const nameEl = card.querySelector(".name");
    if (nameEl) nameEl.textContent = track.displayName || track.name;
    saveStateMeta();
  });

  ui.trackGrid.addEventListener("change", async (ev) => {
    if (ev.target.dataset.upload !== "sample") return;
    const card = ev.target.closest(".card");
    const id = card?.dataset.id;
    const file = ev.target.files?.[0];
    if (!id || !file) return;
    await loadUserSample(file, id, card);
    renderTracks();
    drawAllWaveforms();
    renderMixSelect();
  });

  ui.trackGrid.addEventListener("change", async (ev) => {
    if (ev.target.dataset.library !== "sample") return;
    const card = ev.target.closest(".card");
    const id = card?.dataset.id;
    const url = ev.target.value;
    if (!id || !url) return;
    await loadLibrarySample(url, id, card);
    renderTracks();
    drawAllWaveforms();
    renderMixSelect();
  });

  ui.trackGrid.addEventListener("change", (ev) => {
    const loopType = ev.target.dataset.loop;
    if (!loopType) return;
    const card = ev.target.closest(".card");
    const id = card?.dataset.id;
    if (!id) return;
    const track = sampleTracks.find((t) => t.id === id);
    if (!track) return;
    const newValue = Number(ev.target.value);
    const updated = updateLoopPoints(track, loopType, newValue);
    ev.target.value = updated[loopType];
    // sincronizar para que el siguiente disparo respete los nuevos límites
    drawAllWaveforms();
  });

  ui.trackGrid.addEventListener("pointerdown", (ev) => {
    const container = ev.target.closest("[data-wave]");
    if (!container) return;
    const id = container.dataset.wave;
    const track = sampleTracks.find((t) => t.id === id);
    const canvas = container.querySelector("canvas");
    if (!track || !canvas) return;
    ev.preventDefault();
    const moveHandler = (moveEv) => {
      const rect = canvas.getBoundingClientRect();
      const x = Math.max(0, Math.min(moveEv.clientX - rect.left, rect.width));
      const ratio = rect.width ? x / rect.width : 0;
      const dur = track.sampleBuffer?.duration || 0;
      const absoluteTime = ratio * dur;
      // el handle más cercano es el que se mueve
      const distStart = Math.abs((track.loopStart || 0) - absoluteTime);
      const distEnd = Math.abs((track.loopEnd ?? dur) - absoluteTime);
      const which = distStart <= distEnd ? "start" : "end";
      updateLoopPoints(track, which, absoluteTime);
      const startInput = container.parentElement.querySelector(`input[data-loop="start"]`);
      const endInput = container.parentElement.querySelector(`input[data-loop="end"]`);
      if (startInput) startInput.value = track.loopStart;
      if (endInput) endInput.value = track.loopEnd ?? "";
      drawWaveform(canvas, track);
    };
    const upHandler = () => {
      window.removeEventListener("pointermove", moveHandler);
      window.removeEventListener("pointerup", upHandler);
    };
    window.addEventListener("pointermove", moveHandler);
    window.addEventListener("pointerup", upHandler);
    moveHandler(ev);
  });
}

async function init() {
  ensureBaseSlots();
  currentLang = detectLanguage();
  await initDb();
  await restoreSamplesFromDb();
  loadMixesFromStorage();
  const savedGlobal = Number(localStorage.getItem("edusampler-global-tempo")) || DEFAULT_GLOBAL_FACTOR;
  globalTempoFactor = savedGlobal;
  ui.tempo.value = Math.round(globalTempoFactor * 100);
  ui.tempoValue.textContent = `${Math.round(globalTempoFactor * 100)}%`;
  renderTracks();
  drawAllWaveforms();
  renderSlotSummary();
  syncEngineTracks();
  attachCardEvents();
  renderMixSelect();
  applyTranslations();
  updateSwVersionLabel("SW: esperando...");
  await setupServiceWorker();
  await displaySwVersion();
  if (isPwaInstalled()) {
    hideInstallButton();
  }
}

async function startAudio() {
  await engine.ensureContext();
  engine.setTracks(sampleTracks);
  engine.setGlobalTempoFactor(globalTempoFactor);
}

async function togglePlayPause() {
  await startAudio();
  engine.muteAll(false);
  if (!engine.isRunning) {
    engine.play();
    ui.playToggle.textContent = t("pause");
  } else {
    engine.stop();
    ui.playToggle.textContent = t("play");
  }
}

function addCustomTrack() {
  if (sampleTracks.length >= MAX_SLOTS) {
    alert(t("limit"));
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
  saveStateMeta();
}

function isTypingTarget(el) {
  if (!el) return false;
  if (el.isContentEditable) return true;
  const editableTags = ["INPUT", "TEXTAREA", "SELECT"];
  return editableTags.includes(el.tagName);
}

async function handleKeyBinding(event) {
  const code = event.code;
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.repeat) return;
  if (isTypingTarget(document.activeElement)) return;
  if (code === "Enter" || code === "NumpadEnter") {
    event.preventDefault();
    await togglePlayPause();
    return;
  }
  const targetIndex = KEY_BINDINGS[code];
  if (!targetIndex) return;
  event.preventDefault();

  const track = ensureTrackExistsByIndex(targetIndex);
  if (!track) return;
  await startAudio();
  track.enabled = !track.enabled;
  if (engine.ctx) {
    engine.setTrackEnabled(track.id, track.enabled);
  }
  const card = ui.trackGrid.querySelector(`.card[data-id="${track.id}"]`);
  const toggleBtn = card?.querySelector('[data-action="toggle"]');
  toggleBtn?.classList.toggle("active", track.enabled);
  saveStateMeta();
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
      target.loopStart = 0;
      target.loopEnd = audioBuffer.duration;
      target.waveform = buildWaveform(audioBuffer);
      await saveSampleToDb(target, file);
    }
    recomputeLoopBars();
    saveStateMeta();
    const status = card.querySelector(".upload-status");
    if (status) {
      status.textContent = `${t("loaded")}: ${file.name}`;
    }
  } catch (err) {
    console.error("No se pudo cargar el sample", err);
    const status = card.querySelector(".upload-status");
    if (status) status.textContent = t("statusError");
  }
}

async function loadLibrarySample(url, trackId, card) {
  try {
    await startAudio();
    const response = await fetch(url);
    const blob = await response.blob();
    const fileName = url.split("/").pop() || "library-sample";
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await engine.ctx.decodeAudioData(arrayBuffer.slice(0));
    engine.setSample(trackId, audioBuffer);
    const target = sampleTracks.find((t) => t.id === trackId);
    if (target) {
      target.sampleBuffer = audioBuffer;
      target.fileName = fileName;
      target.tags = ["listo para sonar"];
      target.loopStart = 0;
      target.loopEnd = audioBuffer.duration;
      target.waveform = buildWaveform(audioBuffer);
      const pseudoFile = new File([blob], fileName, { type: blob.type });
      await saveSampleToDb(target, pseudoFile);
    }
    recomputeLoopBars();
    saveStateMeta();
    const status = card.querySelector(".upload-status");
    if (status) {
      const prettyName = getLibraryLabel(target, true) || fileName;
      status.textContent = `${t("loaded")}: ${prettyName}`;
    }
  } catch (err) {
    console.error("No se pudo cargar el sample de biblioteca", err);
    const status = card.querySelector(".upload-status");
    if (status) status.textContent = t("statusError");
  }
}

function renderSlotSummary() {
  if (!ui.slotSummary) return;
  const libres = MAX_SLOTS - sampleTracks.length;
  ui.slotSummary.textContent = t("slotsSummary", { used: sampleTracks.length, free: libres });
  saveStateMeta();
}

function renderMixSelect() {
  if (!ui.mixSelect) return;
  ui.mixSelect.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = t("mixPlaceholder");
  ui.mixSelect.appendChild(placeholder);
  savedMixes.forEach((mix) => {
    const opt = document.createElement("option");
    opt.value = mix.id;
    opt.textContent = `${mix.name} (${new Date(mix.date).toLocaleString()})`;
    ui.mixSelect.appendChild(opt);
  });
}

async function setupServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.register("./service-worker.js");
      // si hay un SW esperando y ya hay uno activo, fuerza que tome el control
      if (navigator.serviceWorker.controller && reg.waiting) {
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
      }
      reg.addEventListener("updatefound", () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener("statechange", () => {
          if (sw.state === "installed" && navigator.serviceWorker.controller) {
            sw.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });
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

let swRefreshing = false;
const hadSwController = !!navigator.serviceWorker?.controller;
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    // solo recarga si ya había un SW controlando
    if (!hadSwController || swRefreshing) return;
    swRefreshing = true;
    window.location.reload();
  });
}

let deferredPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  if (isPwaInstalled()) {
    hideInstallButton();
    return;
  }
  e.preventDefault();
  deferredPrompt = e;
  if (ui.installPwa) ui.installPwa.style.display = "inline-flex";
});

ui.installPwa.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  deferredPrompt = null;
  if (choice?.outcome === "accepted") {
    hideInstallButton();
  }
});

ui.playToggle.addEventListener("click", async () => {
  await togglePlayPause();
});

ui.tempo.addEventListener("input", (e) => {
  const bpm = Number(e.target.value);
  const factor = bpm / 100;
  globalTempoFactor = factor;
  ui.tempoValue.textContent = `${Math.round(factor * 100)}%`;
  localStorage.setItem("edusampler-global-tempo", String(factor));
  if (engine.ctx) {
    engine.setGlobalTempoFactor(factor);
  }
});

ui.muteAll.addEventListener("click", async () => {
  await startAudio();
  const mute = !engine.masterMuted;
  engine.muteAll(mute);
  ui.muteAll.textContent = mute ? t("unmuteAll") : t("muteAll");
});

ui.stopAll.addEventListener("click", () => {
  engine.stop();
  engine.muteAll(true);
  ui.playToggle.textContent = t("play");
});

ui.addSampler.addEventListener("click", () => {
  addCustomTrack();
});

ui.recordMix?.addEventListener("click", async () => {
  await startAudio();
  if (!engine.recording) {
    engine.startRecording();
    if (ui.recordMix) ui.recordMix.textContent = t("recordStop");
    if (ui.recordStatus) ui.recordStatus.textContent = t("recordStatusRecording");
  } else {
    const blob = await engine.stopRecording();
    if (ui.recordMix) ui.recordMix.textContent = t("record");
    if (ui.recordStatus) ui.recordStatus.textContent = t("recordStatusGenerating");
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `edusampler-mix-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      if (ui.recordStatus) ui.recordStatus.textContent = t("recordStatusReady");
    } else {
      if (ui.recordStatus) ui.recordStatus.textContent = t("recordStatusError");
    }
  }
});

document.getElementById("langSelect")?.addEventListener("change", (ev) => {
  const lang = ev.target.value;
  currentLang = lang;
  localStorage.setItem("edusampler-lang", lang);
  applyTranslations();
});

ui.collapseCards?.addEventListener("click", () => {
  cardsCollapsed = !cardsCollapsed;
  if (cardsCollapsed) {
    sampleTracks.forEach((t) => {
      t.expandedOverride = false;
    });
  }
  ui.collapseCards.textContent = cardsCollapsed ? t("expand") : t("collapse");
  renderTracks();
  // actualizar texto de los botones individuales acorde al estado global
  ui.trackGrid.querySelectorAll('[data-action="collapse"]').forEach((btn) => {
    btn.textContent = cardsCollapsed ? t("expand") : t("collapse");
  });
});

ui.newMix?.addEventListener("click", () => {
  startNewMix();
});

ui.mixSelect?.addEventListener("change", async (ev) => {
  const id = ev.target.value;
  if (!id) return;
  await loadMixById(id);
});

window.addEventListener("appinstalled", () => {
  hideInstallButton();
});

window.addEventListener("keydown", (ev) => {
  handleKeyBinding(ev);
});

ui.saveMix?.addEventListener("click", () => {
  const name = prompt(t("promptMix"));
  if (!name) return;
  saveCurrentMix(name.trim());
});

function toggleHelp(show) {
  if (!ui.helpPanel) return;
  const next = typeof show === "boolean" ? show : ui.helpPanel.hasAttribute("hidden");
  if (next) {
    ui.helpPanel.removeAttribute("hidden");
  } else {
    ui.helpPanel.setAttribute("hidden", "true");
  }
}

ui.helpToggle?.addEventListener("click", () => toggleHelp(true));
ui.helpClose?.addEventListener("click", () => toggleHelp(false));

ui.mixSelect?.addEventListener("change", async (ev) => {
  const id = ev.target.value;
  if (!id) return;
  await loadMixById(id);
});

init();
