(() => {
  const pointsEl = document.getElementById("points");
  const ppsEl = document.getElementById("pps");
  const ownedEl = document.getElementById("owned");

  const clickBtn = document.getElementById("clickBtn");

  const buyAutoBtn = document.getElementById("buyAuto");
  const buyMultiBtn = document.getElementById("buyMulti");

  const autoCostEl = document.getElementById("autoCost");
  const multiCostEl = document.getElementById("multiCost");

  const KEY = "klicker_save_v1";


  let points = 0;

  let clickPower = 1;   
  let autos = 0;        

  let autoCost = 10;
  let multiCost = 25;

  function fmt(n) {
    return Math.floor(n).toString();
  }

  function recalcPps() {
    return autos; 
  }

  function render() {
    pointsEl.textContent = `Punkte: ${fmt(points)}`;
    ppsEl.textContent = `Pro Sekunde: ${fmt(recalcPps())}`;

    autoCostEl.textContent = fmt(autoCost);
    multiCostEl.textContent = fmt(multiCost);

    ownedEl.textContent = `Auto-Klicker: ${autos} • Klick-Stärke: ${clickPower}`;

    buyAutoBtn.disabled = points < autoCost;
    buyMultiBtn.disabled = points < multiCost;
  }

  function save() {
    const data = { points, clickPower, autos, autoCost, multiCost };
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const data = JSON.parse(raw);

      points = Number(data.points || 0);
      clickPower = Number(data.clickPower || 1);
      autos = Number(data.autos || 0);
      autoCost = Number(data.autoCost || 10);
      multiCost = Number(data.multiCost || 25);
    } catch {
    }
  }

  clickBtn.addEventListener("click", () => {
    points += clickPower;
    save();
    render();
  });

  buyAutoBtn.addEventListener("click", () => {
    if (points < autoCost) return;
    points -= autoCost;
    autos += 1;

    autoCost = Math.ceil(autoCost * 1.35);

    save();
    render();
  });

  buyMultiBtn.addEventListener("click", () => {
    if (points < multiCost) return;
    points -= multiCost;
    clickPower += 1;

    multiCost = Math.ceil(multiCost * 1.5);

    save();
    render();
  });

  let last = performance.now();
  function tick(now) {
    const dt = (now - last) / 1000;
    last = now;

    const pps = recalcPps();
    if (pps > 0) {
      points += pps * dt;
      save();
      render();
    }

    requestAnimationFrame(tick);
  }

  load();
  render();
  requestAnimationFrame(tick);
})();
