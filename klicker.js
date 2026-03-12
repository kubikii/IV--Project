(() => {
  const pointsEl   = document.getElementById("points");
  const ppsEl      = document.getElementById("pps");
  const ownedEl    = document.getElementById("owned");
  const clickBtn   = document.getElementById("clickBtn");
  const clickPowerDisplay = document.getElementById("clickPowerDisplay");

  const buyAutoBtn  = document.getElementById("buyAuto");
  const buyMultiBtn = document.getElementById("buyMulti");
  const buyMegaBtn  = document.getElementById("buyMega");
  const resetBtn    = document.getElementById("resetBtn");
  const toastEl     = document.getElementById("milestone-toast");

  const autoCostEl  = document.getElementById("autoCost");
  const multiCostEl = document.getElementById("multiCost");
  const megaCostEl  = document.getElementById("megaCost");

  const KEY = "klicker_save_v2";

  let points     = 0;
  let clickPower = 1;
  let autos      = 0;   // +1 pps each
  let megas      = 0;   // +5 pps each
  let autoCost   = 10;
  let multiCost  = 25;
  let megaCost   = 200;

  // Milestones
  const MILESTONES = [100, 500, 1000, 5000, 10000, 50000];
  let lastMilestone = 0;
  let toastTimer = 0;

  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    toastTimer = 2.5;
  }

  function fmt(n) {
    n = Math.floor(n);
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000)     return (n / 1_000).toFixed(1) + "K";
    return n.toString();
  }

  function recalcPps() {
    return autos + megas * 5;
  }

  function checkMilestone() {
    const s = Math.floor(points);
    for (const m of MILESTONES) {
      if (s >= m && lastMilestone < m) {
        lastMilestone = m;
        showToast(`🎉 ${fmt(m)} Punkte erreicht!`);
        break;
      }
    }
  }

  function render() {
    pointsEl.textContent = `Punkte: ${fmt(points)}`;
    ppsEl.textContent    = `Pro Sekunde: ${fmt(recalcPps())}`;

    autoCostEl.textContent  = fmt(autoCost);
    multiCostEl.textContent = fmt(multiCost);
    megaCostEl.textContent  = fmt(megaCost);

    if (clickPowerDisplay) clickPowerDisplay.textContent = clickPower;

    ownedEl.textContent =
      `Auto-Klicker: ${autos} • Mega-Klicker: ${megas} • Klick-Stärke: ${clickPower}`;

    buyAutoBtn.disabled  = points < autoCost;
    buyMultiBtn.disabled = points < multiCost;
    buyMegaBtn.disabled  = points < megaCost;
  }

  function save() {
    const data = { points, clickPower, autos, megas, autoCost, multiCost, megaCost, lastMilestone };
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      // localStorage not available – continue without saving
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      points        = Number(d.points       || 0);
      clickPower    = Number(d.clickPower   || 1);
      autos         = Number(d.autos        || 0);
      megas         = Number(d.megas        || 0);
      autoCost      = Number(d.autoCost     || 10);
      multiCost     = Number(d.multiCost    || 25);
      megaCost      = Number(d.megaCost     || 200);
      lastMilestone = Number(d.lastMilestone || 0);
    } catch {
      // Corrupt save – start fresh
    }
  }

  function doReset() {
    if (!confirm("Spielstand wirklich zurücksetzen?")) return;
    points = 0; clickPower = 1; autos = 0; megas = 0;
    autoCost = 10; multiCost = 25; megaCost = 200; lastMilestone = 0;
    save();
    render();
  }

  // Click button
  clickBtn.addEventListener("click", () => {
    points += clickPower;
    checkMilestone();
    save();
    render();
  });

  // Buy auto
  buyAutoBtn.addEventListener("click", () => {
    if (points < autoCost) return;
    points -= autoCost;
    autos  += 1;
    autoCost = Math.ceil(autoCost * 1.35);
    save(); render();
  });

  // Buy multi (more click power)
  buyMultiBtn.addEventListener("click", () => {
    if (points < multiCost) return;
    points    -= multiCost;
    clickPower += 1;
    multiCost  = Math.ceil(multiCost * 1.5);
    save(); render();
  });

  // Buy mega
  buyMegaBtn.addEventListener("click", () => {
    if (points < megaCost) return;
    points   -= megaCost;
    megas    += 1;
    megaCost  = Math.ceil(megaCost * 1.8);
    save(); render();
  });

  resetBtn.addEventListener("click", doReset);

  // Game loop
  let last = performance.now();
  function tick(now) {
    const dt  = (now - last) / 1000;
    last = now;

    // Toast countdown
    if (toastTimer > 0) {
      toastTimer -= dt;
      if (toastTimer <= 0 && toastEl) {
        toastEl.classList.remove("show");
      }
    }

    const pps = recalcPps();
    if (pps > 0) {
      points += pps * dt;
      checkMilestone();
      save();
      render();
    }

    requestAnimationFrame(tick);
  }

  load();
  render();
  requestAnimationFrame(tick);
})();
