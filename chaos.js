/* ============================================================
   CHAOS ENGINE 💀 — Sounds, TTS, Popups, Effekte, Easter Eggs
   ============================================================ */
(() => {
  const $ = (s) => document.querySelector(s);
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const state = {
    muted: false,
    calm: false,
    serious: false,
    started: false,
  };

  /* ---------------- AUDIO ---------------- */
  let ctx = null, master = null, musicBus = null, crusher = null;

  function makeDistortion(amount) {
    const n = 2048, curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = ((3 + amount) * x * 20 * (Math.PI / 180)) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }

  function initAudio() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -10;
    comp.ratio.value = 6;
    comp.connect(ctx.destination);
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(comp);

    crusher = ctx.createWaveShaper();
    crusher.curve = makeDistortion(40);
    musicBus = ctx.createGain();
    musicBus.gain.value = 0.35;
    crusher.connect(musicBus);
    musicBus.connect(master);
  }

  function tone({ freq = 440, type = "square", dur = 0.2, vol = 0.3, at = 0, slide = null, dest = null }) {
    if (!ctx) return;
    const t = ctx.currentTime + at;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(dest || master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  function noise({ dur = 0.2, vol = 0.3, at = 0, hp = 0, dest = null }) {
    if (!ctx) return;
    const t = ctx.currentTime + at;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = src;
    if (hp) {
      const f = ctx.createBiquadFilter();
      f.type = "highpass";
      f.frequency.value = hp;
      src.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(dest || master);
    src.start(t);
  }

  const sfx = {
    boom() { // vine-boom-artig
      tone({ freq: 110, slide: 35, type: "sine", dur: 1.1, vol: 1 });
      tone({ freq: 220, slide: 50, type: "triangle", dur: 0.5, vol: 0.6 });
      noise({ dur: 0.15, vol: 0.5 });
    },
    airhorn() {
      [0, 0.25, 0.5].forEach((at, i) => {
        const len = i === 2 ? 0.8 : 0.2;
        [466, 470, 233].forEach((f) => tone({ freq: f, type: "sawtooth", dur: len, vol: 0.25, at }));
      });
    },
    coin() {
      tone({ freq: 988, type: "square", dur: 0.08, vol: 0.25 });
      tone({ freq: 1319, type: "square", dur: 0.25, vol: 0.25, at: 0.08 });
    },
    pop() { tone({ freq: rand(300, 900), slide: 60, type: "sine", dur: 0.12, vol: 0.4 }); },
    bruh() {
      tone({ freq: 140, slide: 90, type: "sawtooth", dur: 0.5, vol: 0.5 });
      tone({ freq: 143, slide: 88, type: "square", dur: 0.5, vol: 0.3 });
    },
    fail() { // trauriges Posaunen-Ding
      [392, 370, 349, 330].forEach((f, i) =>
        tone({ freq: f, slide: i === 3 ? 260 : null, type: "sawtooth", dur: i === 3 ? 0.9 : 0.35, vol: 0.35, at: i * 0.35 })
      );
    },
    error() {
      tone({ freq: 880, type: "square", dur: 0.12, vol: 0.3 });
      tone({ freq: 660, type: "square", dur: 0.2, vol: 0.3, at: 0.12 });
    },
    tada() {
      [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, type: "square", dur: 0.4, vol: 0.25, at: i * 0.09 }));
    },
  };

  /* ---------------- MUSIK: Happy Birthday, aber verflucht ---------------- */
  const N = { G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99 };
  const melody = [
    ["G4", .75], ["G4", .25], ["A4", 1], ["G4", 1], ["C5", 1], ["B4", 2],
    ["G4", .75], ["G4", .25], ["A4", 1], ["G4", 1], ["D5", 1], ["C5", 2],
    ["G4", .75], ["G4", .25], ["G5", 1], ["E5", 1], ["C5", 1], ["B4", 1], ["A4", 2],
    ["F5", .75], ["F5", .25], ["E5", 1], ["C5", 1], ["D5", 1], ["C5", 3],
  ];
  const music = { playing: false, timer: null, idx: 0, next: 0, loop: 0, beat: 0, nextBeat: 0 };

  function musicParams() {
    const l = music.loop % 5;
    return { bpm: 140 + l * 30, shift: Math.pow(2, l / 12) };
  }

  function scheduleMusic() {
    if (!ctx || !music.playing) return;
    const ahead = ctx.currentTime + 0.25;
    while (music.next < ahead) {
      const { bpm, shift } = musicParams();
      const spb = 60 / bpm;
      const [note, beats] = melody[music.idx];
      const at = music.next - ctx.currentTime;
      const f = N[note] * shift;
      const dur = beats * spb * 0.9;
      tone({ freq: f, type: "square", dur, vol: 0.5, at, dest: crusher });
      tone({ freq: f * 1.01, type: "sawtooth", dur, vol: 0.25, at, dest: crusher });
      tone({ freq: f / 2, type: "triangle", dur, vol: 0.5, at, dest: crusher });
      music.next += beats * spb;
      music.idx++;
      if (music.idx >= melody.length) {
        music.idx = 0;
        music.loop++;
        music.next += spb; // kurze Pause
      }
    }
    while (music.nextBeat < ahead) {
      const { bpm } = musicParams();
      const spb = 60 / bpm;
      const at = music.nextBeat - ctx.currentTime;
      tone({ freq: 150, slide: 40, type: "sine", dur: 0.25, vol: 0.9, at, dest: musicBus });
      noise({ dur: 0.05, vol: 0.2, at: at + spb / 2, hp: 7000, dest: musicBus });
      music.nextBeat += spb;
    }
  }

  function startMusic() {
    if (!ctx || music.playing) return;
    music.playing = true;
    music.next = music.nextBeat = ctx.currentTime + 0.1;
    music.timer = setInterval(scheduleMusic, 60);
  }
  function stopMusic() {
    music.playing = false;
    clearInterval(music.timer);
  }

  /* ---------------- TTS ---------------- */
  let voices = [];
  function loadVoices() { voices = window.speechSynthesis ? speechSynthesis.getVoices() : []; }
  if (window.speechSynthesis) {
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  }
  function say(text, opts = {}) {
    if (!window.speechSynthesis || state.muted) {
      opts.onend && setTimeout(opts.onend, 800);
      return;
    }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const lang = opts.lang || "de-DE";
    const v = voices.filter((v) => v.lang && v.lang.startsWith(lang.slice(0, 2)));
    if (v.length) u.voice = pick(v);
    u.lang = lang;
    u.pitch = opts.pitch ?? rand(0.1, 2);
    u.rate = opts.rate ?? rand(0.7, 1.6);
    u.volume = 1;
    if (opts.onend) { u.onend = opts.onend; u.onerror = opts.onend; }
    speechSynthesis.speak(u);
  }

  /* ---------------- VISUELLE FX ---------------- */
  function floater(text, x, y, color) {
    if (state.calm) return;
    const el = document.createElement("div");
    el.className = "floater";
    el.textContent = text;
    el.style.left = (x ?? rand(10, window.innerWidth - 200)) + "px";
    el.style.top = (y ?? rand(80, window.innerHeight - 150)) + "px";
    if (color) el.style.color = color;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }

  function banner(text) {
    if (state.calm) return;
    const el = document.createElement("div");
    el.className = "big-banner";
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1700);
  }

  function confetti(n = 60, emojis = ["🎉", "🎂", "🎊", "💀", "🗿", "🔥", "🎁", "✨"]) {
    if (state.calm) return;
    for (let i = 0; i < n; i++) {
      const el = document.createElement("div");
      el.className = "confetti";
      el.textContent = pick(emojis);
      el.style.left = rand(0, 100) + "vw";
      el.style.fontSize = rand(18, 48) + "px";
      const d = rand(2, 4.5);
      el.style.animationDuration = d + "s";
      el.style.animationDelay = rand(0, 1) + "s";
      document.body.appendChild(el);
      setTimeout(() => el.remove(), (d + 1.2) * 1000);
    }
  }

  function shake() {
    if (state.calm) return;
    document.body.classList.remove("shake-hard");
    void document.body.offsetWidth;
    document.body.classList.add("shake-hard");
    setTimeout(() => document.body.classList.remove("shake-hard"), 600);
  }

  function flashInvert() {
    if (state.calm) return;
    const html = document.documentElement;
    let n = 0;
    const iv = setInterval(() => {
      html.classList.toggle("flash-invert");
      if (++n >= 6) { clearInterval(iv); html.classList.remove("flash-invert"); }
    }, 80);
  }

  /* ---------------- GATE ---------------- */
  const loaderMsgs = [
    "Lade Rizz…", "Kalibriere Aura…", "Installiere Skibidi-Treiber…",
    "Verbinde mit Ohio-Server…", "Fanum besteuert deinen RAM…", "Mewing-Modul aktiv…",
    "Lade 6 7…", "Entferne Gehirnzellen…", "Fast fertig, Digga…",
  ];
  const fakePercents = [3, 12, 27, 41, 69, 67, 42, 88, 99, 420, 100];

  $("#gate-btn").addEventListener("click", () => {
    initAudio();
    if (ctx && ctx.state === "suspended") ctx.resume();
    sfx.airhorn();
    $("#gate-btn").hidden = true;
    $("#loader").hidden = false;
    let i = 0;
    const iv = setInterval(() => {
      const p = fakePercents[i];
      $("#bar-fill").style.width = Math.min(p, 100) + "%";
      $("#loader-text").textContent = `${pick(loaderMsgs)} ${p}%`;
      sfx.pop();
      i++;
      if (i >= fakePercents.length) {
        clearInterval(iv);
        setTimeout(enter, 400);
      }
    }, 280);
  });

  function enter() {
    $("#gate").remove();
    document.body.classList.remove("gated");
    state.started = true;
    sfx.boom();
    banner("JASON.EXE GESTARTET");
    confetti(80);
    say("Happy Birthday Jason! Du absoluter Sigma!", { pitch: 0.3, rate: 0.9 });
    setTimeout(startMusic, 1500);
    scheduleRandomEvent();
    schedulePopup(8000);
  }
  document.body.classList.add("gated");

  /* ---------------- TICKER ---------------- */
  const tickerItems = [
    "BREAKING: Jason offiziell Sigma",
    "Lebenserwartung −1 Jahr",
    "Fanum Tax auf den Kuchen erhoben",
    "6 7 6 7 6 7",
    "Experten: Aura von Jason nicht mehr messbar",
    "Ohio meldet Rekord-Gyatt-Werte",
    "Skibidi-Klo beantragt Asyl",
    "Tung Tung Tung Sahur auf dem Weg zur Party",
    "Mewing-Streak: unendlich",
    "Kuchen-Lieferung von Fanum abgefangen",
    "Chat, ist das echt?",
    "Wissenschaftler bestätigen: Jason ist ein Jahr älter, aber nicht weiser",
    "Rizz-Index steigt um 420 Punkte",
    "W Geburtstag, L Rücken",
  ];
  $("#ticker").textContent = [...tickerItems, ...tickerItems].join("  +++  ") + "  +++";

  /* ---------------- AURA ---------------- */
  const auraEl = $("#aura"), auraReason = $("#aura-reason");
  let aura = 0;
  const auraEvents = [
    [1000, "hat Geburtstag"], [-500, "ist jetzt offiziell alt"], [67, "6 7"],
    [420, "hat den Kuchen nicht geteilt"], [-1000, "wurde in Ohio gesichtet"],
    [9000, "hat 3 Sekunden gemewt"], [-67, "hat \"cringe\" gesagt"],
    [300, "hat ein Geschenk bekommen"], [-200, "Fanum hat sein Stück gegessen"],
    [1337, "Aura-Farming im Schlaf"], [-1, "hat geblinzelt"], [5000, "ist einfach Jason"],
    [-3000, "hat \"Skibidi\" falsch geschrieben"], [777, "Glückszahl, keine Ahnung"],
  ];
  function setAura(delta, reason) {
    aura += delta;
    auraEl.textContent = aura.toLocaleString("de-DE");
    auraEl.classList.toggle("neg", aura < 0);
    auraReason.textContent = `${delta > 0 ? "+" : ""}${delta.toLocaleString("de-DE")} Aura: ${reason}`;
  }
  setInterval(() => {
    if (!state.started || state.serious) return;
    const [d, r] = pick(auraEvents);
    setAura(d, r);
  }, 1800);
  $("#aura-btn").addEventListener("click", (e) => {
    const d = Math.floor(rand(50, 2000));
    setAura(d, "manuelles Farming 🌾");
    sfx.coin();
    floater(`+${d} AURA`, e.clientX - 60, e.clientY - 40);
  });

  /* ---------------- BRAINROT WALL ---------------- */
  const chars = [
    { emo: "🍝🗿", name: "Jasonini Tortellini", txt: "Auguri, fratello del rizz! Tanti auguri, Jasonini!", lang: "it-IT" },
    { emo: "🪵🥁", name: "Tung Tung Tung Torte", txt: "Tung tung tung tung tung tung tung tung tung Torte! Happy Birthday Jason!" },
    { emo: "🐊✈️", name: "Bombardiro Geburtstagodilo", txt: "Bombardiro Geburtstagodilo wirft dreihundert Kerzen über Jasons Haus ab!" },
    { emo: "🩰☕", name: "Ballerina Kuchenccina", txt: "Mi mi mi mi! Ballerina Kuchenccina tanzt nur für dich, Jason. Mi mi mi!" },
    { emo: "🦈👟", name: "Tralalero Jasonlala", txt: "Tralalero tralala, Jason ist ein Jahr älter, porco dio, tralala!", lang: "it-IT" },
    { emo: "🌵🐘", name: "Lirili Larila Party", txt: "Lirili larila, die Zeit vergeht, und Jason wird alt. Lirili larila." },
    { emo: "🥥🐒", name: "Brr Brr Patapim", txt: "Brr brr patapim! Mein Hut ist voller Kuchen! Patapim!" },
    { emo: "🚽🎤", name: "Skibidi Gratulator", txt: "Skibidi dop dop dop jes jes! Skibidi Geburtstag, Jason! Dop dop jes jes!" },
    { emo: "🧌🍰", name: "Fanum (der Dieb)", txt: "Hallo Jason. Ich nehme mir nur ein kleines Stück. Fanum Tax. Danke." },
    { emo: "🗿🗿", name: "Der Moai-Rat", txt: "Der Rat der Moais hat getagt. Ergebnis: Jason ist Sigma. Sitzung beendet.", pitch: 0.1, rate: 0.6 },
    { emo: "🐸💬", name: "Chat", txt: "Chat, ist das echt? Jason hat Geburtstag? W! W! W! W! W!" },
    { emo: "6️⃣7️⃣", name: "Six Seven", txt: "Six seven! Six seven! Six seven! Six seven! Six seven!", lang: "en-US" },
  ];
  const wall = $("#wall");
  chars.forEach((c) => {
    const el = document.createElement("div");
    el.className = "card";
    el.innerHTML = `<div class="emo">${c.emo}</div><h3>${c.name}</h3><p>„${c.txt}“</p>`;
    el.addEventListener("click", () => {
      document.querySelectorAll(".card.talking").forEach((x) => x.classList.remove("talking"));
      el.classList.add("talking");
      sfx.boom();
      say(c.txt, { lang: c.lang, pitch: c.pitch, rate: c.rate, onend: () => el.classList.remove("talking") });
    });
    wall.appendChild(el);
  });

  /* ---------------- SKIBIDI ---------------- */
  const skibidiLines = [
    "Skibidi Jason!", "Ich bin du, Jason.", "Gyatt!", "Was geht, Digga?", "Bro dachte, er wird nicht älter.",
    "Rizz level: Jason.", "Ohio Final Boss.",
  ];
  $("#skibidi").addEventListener("click", (e) => {
    sfx.boom();
    shake();
    floater(pick(["SKIBIDI", "GYATT", "RIZZ", "+1000 AURA", "SIGMA"]), e.clientX - 60, e.clientY - 60);
    say(pick(skibidiLines));
  });

  /* ---------------- SPLIT SCREEN ---------------- */
  $("#split-btn").addEventListener("click", () => {
    const sp = $("#split");
    sp.hidden = !sp.hidden;
    $("#split-btn").textContent = sp.hidden ? "SUBWAY-SURFERS-MODUS AKTIVIEREN" : "OKAY ICH KANN MICH WIEDER KONZENTRIEREN";
    sfx.coin();
  });

  /* ---------------- POPUPS ---------------- */
  const popupMsgs = [
    { t: "Systemwarnung", ico: "⚠️", m: "Ihr PC hat 1 Gyatt gefunden. Entfernen?", b: ["JA", "AUF JEDEN"] },
    { t: "Windows Defender", ico: "🛡️", m: "Virus erkannt: Skibidi.exe. Sie haben gratis Aura gewonnen.", b: ["OK", "AUCH OK"] },
    { t: "Fanum Steuerbehörde", ico: "🧌", m: "Ihr Kuchen wurde zu 67% besteuert. Widerspruch zwecklos.", b: ["OK 😭"] },
    { t: "Achtung", ico: "📍", m: "Sie befinden sich jetzt in Ohio. Viel Glück.", b: ["HILFE", "OK"] },
    { t: "Aura-Update", ico: "🔮", m: "Ein Update für Ihre Aura ist verfügbar (+1000). Jetzt installieren?", b: ["INSTALLIEREN", "SOFORT"] },
    { t: "Glückwunsch!!!", ico: "🎉", m: "Sie sind der 1.000.000ste Besucher! Ihr Preis: ein Jahr älter.", b: ["DANKE?"] },
    { t: "Rizz.dll", ico: "💀", m: "Rizz.dll konnte nicht geladen werden. Bitte mewing neu starten.", b: ["MEWING"] },
    { t: "Chat", ico: "💬", m: "Chat, ist das echt?", b: ["ECHT", "FAKE"] },
  ];

  function spawnPopup() {
    if (state.serious) return;
    const p = pick(popupMsgs);
    const el = document.createElement("div");
    el.className = "popup";
    el.innerHTML = `
      <div class="title"><span>${p.t}</span><button class="x" aria-label="schließen">✕</button></div>
      <div class="body"><span class="ico">${p.ico}</span><span>${p.m}</span></div>
      <div class="btns">${p.b.map((b) => `<button>${b}</button>`).join("")}</div>`;
    const place = () => {
      el.style.left = rand(8, Math.max(8, window.innerWidth - 340)) + "px";
      el.style.top = rand(70, Math.max(70, window.innerHeight - 220)) + "px";
    };
    place();
    $("#popups").appendChild(el);
    sfx.error();

    // Der X-Button flüchtet ein paar Mal
    let escapes = Math.floor(rand(2, 5));
    const x = el.querySelector(".x");
    const flee = (ev) => {
      if (escapes-- > 0) {
        ev.preventDefault();
        place();
        sfx.pop();
      }
    };
    x.addEventListener("mouseenter", flee);
    x.addEventListener("touchstart", flee, { passive: false });
    x.addEventListener("click", () => { el.remove(); sfx.bruh(); });
    el.querySelectorAll(".btns button").forEach((b) =>
      b.addEventListener("click", () => {
        el.remove();
        sfx.boom();
        floater(pick(["W", "+500 AURA", "SIGMA MOVE", "GYATT"]));
        if (Math.random() < 0.4) setTimeout(spawnPopup, 300); // Hydra-Popup
      })
    );
  }

  function schedulePopup(delay) {
    setTimeout(() => {
      if (document.querySelectorAll(".popup").length < 4) spawnPopup();
      schedulePopup(rand(12000, 25000));
    }, delay);
  }

  /* ---------------- RANDOM EVENTS ---------------- */
  const randomEvents = [
    () => { sfx.boom(); shake(); },
    () => { sfx.airhorn(); banner(pick(["W", "6 7", "+1000 AURA", "SIGMA", "GYATT", "OHIO", "RIZZ"])); },
    () => { sfx.boom(); flashInvert(); },
    () => { sfx.tada(); confetti(40); },
    () => { say(pick(["Jason.", "Happy Birthday.", "Six seven.", "Skibidi.", "Bist du noch da?", "Fanum Tax."]), {}); },
  ];
  function scheduleRandomEvent() {
    setTimeout(() => {
      if (!state.serious && !state.calm && !document.hidden) pick(randomEvents)();
      scheduleRandomEvent();
    }, rand(7000, 15000));
  }

  /* ---------------- CURSOR TRAIL ---------------- */
  const trailEmojis = ["💀", "🔥", "🎂", "🗿", "✨", "🎉"];
  let lastTrail = 0;
  function trail(x, y) {
    if (state.calm || state.serious) return;
    const now = performance.now();
    if (now - lastTrail < 45) return;
    lastTrail = now;
    const el = document.createElement("div");
    el.className = "trail";
    el.textContent = pick(trailEmojis);
    el.style.left = x - 12 + "px";
    el.style.top = y - 12 + "px";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 950);
  }
  window.addEventListener("mousemove", (e) => trail(e.clientX, e.clientY));
  window.addEventListener("touchmove", (e) => { const t = e.touches[0]; t && trail(t.clientX, t.clientY); }, { passive: true });

  /* ---------------- EASTER EGGS ---------------- */
  let typed = "";
  const konami = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let kIdx = 0;
  window.addEventListener("keydown", (e) => {
    if (!state.started) return;
    // Konami
    kIdx = e.key === konami[kIdx] ? kIdx + 1 : (e.key === konami[0] ? 1 : 0);
    if (kIdx === konami.length) {
      kIdx = 0;
      sfx.tada();
      confetti(200);
      banner("KONAMI RIZZ");
      say("Cheat Code aktiviert. Unendlich Aura.");
      setAura(999999, "Cheat-Code 🎮");
    }
    if (e.key.length !== 1) return;
    typed = (typed + e.key.toLowerCase()).slice(-10);
    if (typed.endsWith("sigma")) ohioMode();
    if (typed.endsWith("67")) { banner("6 7"); say("six seven", { lang: "en-US" }); }
    if (typed.endsWith("jason")) { sfx.airhorn(); banner("DAS BIN ICH"); }
  });

  function ohioMode() {
    sfx.boom();
    say("Willkommen in Ohio.", { pitch: 0.1, rate: 0.5 });
    document.documentElement.classList.add("ohio");
    document.body.classList.add("ohio");
    setTimeout(() => {
      document.documentElement.classList.remove("ohio");
      document.body.classList.remove("ohio");
    }, 8000);
  }

  /* ---------------- TAB TITLE ---------------- */
  const origTitle = document.title;
  document.addEventListener("visibilitychange", () => {
    document.title = document.hidden ? "KOMM ZURÜCK JASON 😭😭😭" : origTitle;
    if (!document.hidden && state.started) { sfx.boom(); floater("BRO IST ZURÜCK"); }
  });

  /* ---------------- ERNST-MOMENT ---------------- */
  const seriousInner = $(".serious-inner");
  let wasSerious = false;
  new IntersectionObserver((entries) => {
    const vis = entries[0].isIntersecting;
    if (!state.started) return;
    if (vis && !wasSerious) {
      wasSerious = true;
      state.serious = true;
      document.body.classList.add("serious-mode");
      stopMusic();
      if (window.speechSynthesis) speechSynthesis.cancel();
      document.querySelectorAll(".popup").forEach((p) => p.remove());
    } else if (!vis && wasSerious) {
      wasSerious = false;
      state.serious = false;
      document.body.classList.remove("serious-mode");
      sfx.airhorn();
      banner("OKAY GENUG");
      if (!state.muted) startMusic();
    }
  }, { threshold: 0.6 }).observe(seriousInner);

  /* ---------------- CONTROLS ---------------- */
  $("#mute-btn").addEventListener("click", () => {
    state.muted = !state.muted;
    $("#mute-btn").textContent = state.muted ? "🔇" : "🔊";
    if (master) master.gain.value = state.muted ? 0 : 0.9;
    if (state.muted && window.speechSynthesis) speechSynthesis.cancel();
  });
  $("#calm-btn").addEventListener("click", () => {
    state.calm = !state.calm;
    document.body.classList.toggle("calm", state.calm);
    $("#calm-btn").classList.toggle("on", state.calm);
  });

  /* ---------------- EXPORT für game.js ---------------- */
  window.Chaos = { sfx, say, floater, banner, confetti, shake, flashInvert, rand, pick };
})();
