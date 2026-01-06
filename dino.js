(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const restartBtn = document.getElementById("restartBtn");

  // ---- Einstellungen
  const GROUND_Y = canvas.height - 40;
  const GRAVITY = 2200;        // px/s²
  const JUMP_VEL = -760;       // px/s
  const PLAYER_W = 34;
  const PLAYER_H = 44;

  // ---- State
  let running = true;
  let lastTs = 0;
  let time = 0;

  const bestKey = "dino_best";
  let best = Number(localStorage.getItem(bestKey) || 0);

  const player = {
    x: 70,
    y: GROUND_Y - PLAYER_H,
    w: PLAYER_W,
    h: PLAYER_H,
    vy: 0,
    onGround: true,
  };

  const obstacles = [];
  let spawnTimer = 0;

  let score = 0;
  bestEl.textContent = `Best: ${best}`;

  function resetGame() {
    running = true;
    lastTs = 0;
    time = 0;
    score = 0;
    spawnTimer = 0;

    player.y = GROUND_Y - PLAYER_H;
    player.vy = 0;
    player.onGround = true;

    obstacles.length = 0;

    scoreEl.textContent = "Score: 0";
  }

  function jump() {
    if (!running) return;
    if (player.onGround) {
      player.vy = JUMP_VEL;
      player.onGround = false;
    }
  }

  function restart() {
    resetGame();
    requestAnimationFrame(loop);
  }

  function rectsOverlap(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  function spawnObstacle() {
    // Unterschiedliche Hindernis-Höhen/Breiten
    const type = Math.random();
    let w, h;

    if (type < 0.65) {
      // kleiner Kaktus
      w = 18;
      h = 34;
    } else if (type < 0.9) {
      // großer Kaktus
      w = 26;
      h = 52;
    } else {
      // "Vogel" (fliegt höher)
      w = 30;
      h = 18;
    }

    const y = (h === 18)
      ? (GROUND_Y - PLAYER_H - 40) // fliegendes Hindernis
      : (GROUND_Y - h);            // Bodenhindernis

    obstacles.push({
      x: canvas.width + 20,
      y,
      w,
      h,
      passed: false,
    });
  }

  function speed() {
    // wird mit Score langsam schneller
    // 350 px/s Start, bis ~ 900 px/s
    return Math.min(350 + score * 4, 900);
  }

  function update(dt) {
    time += dt;

    // Score steigt mit Zeit
    score += dt * 10;
    scoreEl.textContent = `Score: ${Math.floor(score)}`;

    // Player Physik
    player.vy += GRAVITY * dt;
    player.y += player.vy * dt;

    if (player.y >= GROUND_Y - player.h) {
      player.y = GROUND_Y - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    // Spawning: mit mehr Score öfter
    spawnTimer -= dt;
    const baseInterval = 1.35; // Sekunden
    const minInterval = 0.65;
    const interval = Math.max(minInterval, baseInterval - score / 800);

    if (spawnTimer <= 0) {
      spawnObstacle();
      // kleine Random-Varianz
      spawnTimer = interval + (Math.random() * 0.35);
    }

    // Obstacles bewegen + Kollision
    const vx = speed();

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= vx * dt;

      // Collision
      if (rectsOverlap(player, o)) {
        running = false;
      }

      // Entfernen, wenn raus
      if (o.x + o.w < -20) {
        obstacles.splice(i, 1);
      }
    }

    // Best Score speichern
    if (!running) {
      const s = Math.floor(score);
      if (s > best) {
        best = s;
        localStorage.setItem(bestKey, String(best));
        bestEl.textContent = `Best: ${best}`;
      }
    }
  }

  function draw() {
    // Hintergrund
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Himmel
    ctx.fillStyle = "#eaf6ff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Bodenlinie
    ctx.fillStyle = "#222";
    ctx.fillRect(0, GROUND_Y, canvas.width, 2);

    // Player (Dino als Block)
    ctx.fillStyle = "#111";
    ctx.fillRect(player.x, player.y, player.w, player.h);

    // Player-„Auge“
    ctx.fillStyle = "#fff";
    ctx.fillRect(player.x + player.w - 10, player.y + 10, 4, 4);

    // Obstacles
    for (const o of obstacles) {
      if (o.h === 18) {
        // Vogel
        ctx.fillStyle = "#333";
        ctx.fillRect(o.x, o.y, o.w, o.h);
        // Flügel
        ctx.fillRect(o.x + 6, o.y - 6, o.w - 12, 4);
      } else {
        // Kaktus
        ctx.fillStyle = "#0a7a2a";
        ctx.fillRect(o.x, o.y, o.w, o.h);
        // kleine "Arme"
        ctx.fillRect(o.x - 6, o.y + 12, 6, 10);
        ctx.fillRect(o.x + o.w, o.y + 18, 6, 10);
      }
    }

    // Game Over Overlay
    if (!running) {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#fff";
      ctx.font = "bold 34px Arial";
      ctx.fillText("GAME OVER", canvas.width / 2 - 110, canvas.height / 2 - 10);

      ctx.font = "16px Arial";
      ctx.fillText("Drück R oder klick auf Neustart", canvas.width / 2 - 120, canvas.height / 2 + 24);
    }
  }

  function loop(ts) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min((ts - lastTs) / 1000, 0.033); // max ~33ms
    lastTs = ts;

    if (running) {
      update(dt);
      draw();
      requestAnimationFrame(loop);
    } else {
      draw();
    }
  }

  // ---- Controls
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp") {
      e.preventDefault();
      jump();
    }
    if (e.code === "KeyR") {
      restart();
    }
  });

  canvas.addEventListener("mousedown", () => {
    if (!running) return;
    jump();
  });

  // Touch (Handy)
  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (!running) return;
    jump();
  }, { passive: false });

  restartBtn.addEventListener("click", restart);

  // Start
  resetGame();
  requestAnimationFrame(loop);
})();
