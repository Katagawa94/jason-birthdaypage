/* ============================================================
   FANUM TAX: RETTE DEN KUCHEN 🎂🧌
   ============================================================ */
(() => {
  const C = window.Chaos;
  const canvas = document.getElementById("game");
  const g = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const overlay = document.getElementById("game-overlay");
  const goTitle = document.getElementById("go-title");
  const goText = document.getElementById("go-text");
  const goBest = document.getElementById("go-best");
  const startBtn = document.getElementById("game-start");

  const BEST_KEY = "fanumtax-best";
  const loadBest = () => { try { return +localStorage.getItem(BEST_KEY) || 0; } catch { return 0; } };
  const saveBest = (v) => { try { localStorage.setItem(BEST_KEY, v); } catch {} };

  const TYPES = [
    { e: "🎂", w: 34, kind: "cake" },
    { e: "🎁", w: 14, kind: "gift" },
    { e: "🕯️", w: 8, kind: "candle" },
    { e: "🚽", w: 22, kind: "toilet" },
    { e: "🧌", w: 7, kind: "fanum" },
    { e: "📉", w: 7, kind: "L" },
  ];
  const TOTAL_W = TYPES.reduce((s, t) => s + t.w, 0);
  function randomType() {
    let r = Math.random() * TOTAL_W;
    for (const t of TYPES) { if ((r -= t.w) < 0) return t; }
    return TYPES[0];
  }

  let s; // Spielzustand
  function reset() {
    s = {
      running: false,
      x: W / 2, targetX: W / 2,
      lives: 3, score: 0, mult: 1, speed: 1, age: 0,
      items: [], texts: [], stars: [],
      spawnT: 0, time: 0,
      cakeLog: [], // [{t, pts}] für Fanum Tax
      lUntil: 0, hitFlash: 0,
      keys: { left: false, right: false },
    };
    for (let i = 0; i < 40; i++) s.stars.push({ x: Math.random() * W, y: Math.random() * H, v: 20 + Math.random() * 60, e: C.pick(["✨", "·", "💀", "⭐"]) });
  }
  reset();

  /* ---------- Input ---------- */
  function toCanvasX(clientX) {
    const r = canvas.getBoundingClientRect();
    return ((clientX - r.left) / r.width) * W;
  }
  function setTarget(clientX) {
    let x = toCanvasX(clientX);
    if (s.time < s.lUntil) x = W - x; // L = Steuerung vertauscht
    s.targetX = x;
  }
  canvas.addEventListener("mousemove", (e) => setTarget(e.clientX));
  canvas.addEventListener("touchstart", (e) => { setTarget(e.touches[0].clientX); e.preventDefault(); }, { passive: false });
  canvas.addEventListener("touchmove", (e) => { setTarget(e.touches[0].clientX); e.preventDefault(); }, { passive: false });
  window.addEventListener("keydown", (e) => {
    if (!s.running) return;
    if (e.key === "ArrowLeft" || e.key === "a") { s.keys.left = true; e.preventDefault(); }
    if (e.key === "ArrowRight" || e.key === "d") { s.keys.right = true; e.preventDefault(); }
  });
  window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a") s.keys.left = false;
    if (e.key === "ArrowRight" || e.key === "d") s.keys.right = false;
  });

  /* ---------- Spiel-Logik ---------- */
  function addText(text, x, y, color = "#fff200", size = 28) {
    s.texts.push({ text, x, y, color, size, life: 1.2 });
  }

  function spawn() {
    const t = randomType();
    s.items.push({
      ...t,
      x: 30 + Math.random() * (W - 60),
      y: -30,
      vy: (140 + Math.random() * 90) * s.speed,
      wob: Math.random() * Math.PI * 2,
      rot: (Math.random() - 0.5) * 4,
    });
  }

  function catchItem(it) {
    const px = s.x, py = H - 70;
    switch (it.kind) {
      case "cake": {
        const pts = Math.round(67 * s.mult);
        s.score += pts;
        s.cakeLog.push({ t: s.time, pts });
        addText(`+${pts}`, it.x, py - 40);
        C.sfx.coin();
        break;
      }
      case "gift": {
        const pts = Math.round(100 * s.mult);
        s.score += pts;
        addText(`+${pts} 🎁`, it.x, py - 40, "#00fff2");
        C.sfx.tada();
        break;
      }
      case "candle":
        s.age++;
        s.speed *= 1.12;
        s.mult += 0.5;
        addText("+1 LEBENSJAHR", W / 2, H / 2, "#ff00e6", 36);
        addText(`MULTI x${s.mult.toFixed(1)}`, W / 2, H / 2 + 40, "#39ff14", 26);
        C.sfx.airhorn();
        break;
      case "toilet":
        s.lives--;
        s.hitFlash = 0.4;
        addText("SKIBIDI'D 💀", px, py - 50, "#ff3030", 32);
        C.sfx.boom();
        C.shake();
        break;
      case "fanum": {
        const recent = s.cakeLog.filter((c) => s.time - c.t <= 5);
        const lost = recent.reduce((a, c) => a + c.pts, 0);
        s.score = Math.max(0, s.score - lost);
        s.cakeLog = s.cakeLog.filter((c) => s.time - c.t > 5);
        addText("FANUM TAX!", W / 2, H / 2 - 40, "#ff3030", 44);
        addText(lost ? `−${lost}` : "(du hattest nix lol)", W / 2, H / 2 + 5, "#fff", 26);
        C.sfx.bruh();
        C.say("Fanum Tax!", { pitch: 0.4, rate: 1.1 });
        break;
      }
      case "L":
        s.lUntil = s.time + 2.5;
        addText("L", W / 2, H / 2, "#aaa", 120);
        addText("steuerung vertauscht 🤡", W / 2, H / 2 + 60, "#aaa", 22);
        C.sfx.fail();
        break;
    }
  }

  function update(dt) {
    s.time += dt;

    // Spawnen, wird mit der Zeit schneller
    s.spawnT -= dt;
    if (s.spawnT <= 0) {
      spawn();
      s.spawnT = Math.max(0.28, 0.9 - s.time * 0.012) / Math.sqrt(s.speed);
    }
    s.speed += dt * 0.008;

    // Spieler
    const inverted = s.time < s.lUntil;
    const kdir = (s.keys.right ? 1 : 0) - (s.keys.left ? 1 : 0);
    if (kdir) s.targetX += kdir * (inverted ? -1 : 1) * 520 * dt;
    s.targetX = Math.max(30, Math.min(W - 30, s.targetX));
    s.x += (s.targetX - s.x) * Math.min(1, dt * 14);

    // Items
    const py = H - 70;
    for (const it of s.items) {
      it.y += it.vy * dt;
      it.wob += dt * 5;
      it.x += Math.sin(it.wob) * 40 * dt;
      const dx = it.x - s.x, dy = it.y - py;
      if (!it.dead && Math.abs(dx) < 42 && Math.abs(dy) < 40) {
        it.dead = true;
        catchItem(it);
      }
      if (it.y > H + 40) it.dead = true;
    }
    s.items = s.items.filter((i) => !i.dead);

    for (const t of s.texts) { t.life -= dt; t.y -= 40 * dt; }
    s.texts = s.texts.filter((t) => t.life > 0);
    for (const st of s.stars) { st.y += st.v * s.speed * dt; if (st.y > H) { st.y = -10; st.x = Math.random() * W; } }
    s.hitFlash = Math.max(0, s.hitFlash - dt);

    if (s.lives <= 0) gameOver();
  }

  /* ---------- Zeichnen ---------- */
  function draw() {
    const grey = s.time < s.lUntil;
    g.save();
    g.filter = grey ? "grayscale(1) contrast(1.4)" : "none";

    // Hintergrund
    const hue = (s.time * 40) % 360;
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, `hsl(${hue}, 80%, 12%)`);
    grad.addColorStop(1, `hsl(${(hue + 120) % 360}, 80%, 6%)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, W, H);

    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = "14px sans-serif";
    g.fillStyle = "rgba(255,255,255,.5)";
    for (const st of s.stars) g.fillText(st.e, st.x, st.y);

    // Items
    g.font = "40px serif";
    for (const it of s.items) {
      g.save();
      g.translate(it.x, it.y);
      g.rotate(Math.sin(it.wob) * 0.3);
      g.fillText(it.e, 0, 0);
      g.restore();
    }

    // Spieler: Jason
    const py = H - 70;
    const bob = Math.sin(s.time * 12) * 3;
    g.font = "54px serif";
    g.fillText("🗿", s.x, py + bob);
    g.font = "bold 14px Impact, Arial Black, sans-serif";
    g.fillStyle = "#fff200";
    g.fillText("JASON", s.x, py + 38);

    // Texte
    for (const t of s.texts) {
      g.globalAlpha = Math.min(1, t.life * 2);
      g.font = `bold ${t.size}px Impact, Arial Black, sans-serif`;
      g.lineWidth = 4;
      g.strokeStyle = "#000";
      g.strokeText(t.text, t.x, t.y);
      g.fillStyle = t.color;
      g.fillText(t.text, t.x, t.y);
    }
    g.globalAlpha = 1;

    // HUD
    g.textAlign = "left";
    g.font = "bold 22px Impact, Arial Black, sans-serif";
    g.lineWidth = 4;
    g.strokeStyle = "#000";
    const hud = `AURA ${s.score}`;
    g.strokeText(hud, 12, 24); g.fillStyle = "#39ff14"; g.fillText(hud, 12, 24);
    g.textAlign = "right";
    const lives = "❤️".repeat(Math.max(0, s.lives)) + "🖤".repeat(Math.max(0, 3 - s.lives));
    g.font = "22px serif";
    g.fillText(lives, W - 10, 24);
    g.font = "bold 16px Impact, Arial Black, sans-serif";
    g.fillStyle = "#ff00e6";
    g.strokeText(`x${s.mult.toFixed(1)}`, W - 10, 52); g.fillText(`x${s.mult.toFixed(1)}`, W - 10, 52);

    if (s.hitFlash > 0) {
      g.fillStyle = `rgba(255,0,0,${s.hitFlash})`;
      g.fillRect(0, 0, W, H);
    }
    g.restore();
  }

  /* ---------- Loop ---------- */
  let last = 0;
  function loop(ts) {
    if (!s.running) return;
    const dt = Math.min(0.05, (ts - last) / 1000 || 0);
    last = ts;
    update(dt);
    draw();
    if (s.running) requestAnimationFrame(loop);
  }

  function start() {
    reset();
    s.running = true;
    overlay.hidden = true;
    C.sfx.airhorn();
    C.say("Los geht's! Rette den Kuchen!", { pitch: 1.5, rate: 1.3 });
    last = performance.now();
    requestAnimationFrame(loop);
  }

  const RANKS = [
    [500, "OHIO-BEWOHNER", "Bruder… was war das? 💀", "Ohio Bewohner. Peinlich."],
    [1500, "NPC MIT POTENZIAL", "Nicht schlecht, aber Fanum lacht über dich.", "NPC mit Potenzial."],
    [3000, "RIZZLER", "Solide Aura. Respekt, Digga. 🔥", "Rizzler! Respekt!"],
    [Infinity, "SKIBIDI SIGMA GEBURTSTAGSKÖNIG", "ABSOLUTE LEGENDE. Der Kuchen gehört dir. 👑", "Skibidi Sigma Geburtstagskönig! Absolute Legende!"],
  ];

  function gameOver() {
    s.running = false;
    draw();
    const [, title, text, spoken] = RANKS.find(([lim]) => s.score < lim);
    const best = loadBest();
    const isBest = s.score > best;
    if (isBest) saveBest(s.score);
    goTitle.textContent = title;
    goText.innerHTML = `${s.score} Aura · ${s.age} Kerzen gefangen<br>${text}`;
    goBest.textContent = isBest ? "🏆 NEUER REKORD, BRUDER! 🏆" : `Dein Rekord, Bruder: ${best}`;
    startBtn.textContent = "NOCHMAL 🔁";
    overlay.hidden = false;
    if (title === RANKS[3][1]) {
      C.sfx.tada();
      C.confetti(150, ["👑", "🎂", "🗿", "🔥", "🎉"]);
    } else {
      C.sfx.fail();
    }
    setTimeout(() => C.say(spoken, { pitch: 0.6, rate: 1 }), 900);
  }

  startBtn.addEventListener("click", start);

  const best = loadBest();
  if (best) goBest.textContent = `Dein Rekord, Bruder: ${best}`;
  draw();
})();
