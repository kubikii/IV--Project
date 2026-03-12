(() => {
  const canvas    = document.getElementById("game");
  const ctx       = canvas.getContext("2d");
  const scoreEl   = document.getElementById("score");
  const bestEl    = document.getElementById("best");
  const restartBtn = document.getElementById("restartBtn");
  const toastEl   = document.getElementById("milestone-toast");

  const GROUND_Y  = canvas.height - 40;
  const GRAVITY   = 2200;
  const JUMP_VEL  = -760;
  const PLAYER_W  = 34;
  const PLAYER_H  = 44;

  let running  = true;
  let lastTs   = 0;
  let time     = 0;
  let score    = 0;

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

  // Scrolling ground lines
  let groundOffset = 0;

  // Milestone toast
  const MILESTONES = [100, 250, 500, 1000, 2000];
  let lastMilestone = 0;
  let toastTimer = 0;

  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    toastTimer = 2.5;
  }

  function checkMilestone() {
    const s = Math.floor(score);
    for (const m of MILESTONES) {
      if (s >= m && lastMilestone < m) {
        lastMilestone = m;
        showToast(`🎉 ${m} Punkte erreicht!`);
        break;
      }
    }
  }

  function resetGame() {
    running     = true;
    lastTs      = 0;
    time        = 0;
    score       = 0;
    spawnTimer  = 0;
    lastMilestone = 0;
    groundOffset  = 0;

    player.y       = GROUND_Y - PLAYER_H;
    player.vy      = 0;
    player.onGround = true;

    obstacles.length = 0;
    scoreEl.textContent = "Score: 0";
    bestEl.textContent  = `Best: ${best}`;
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
    const margin = 4; // slight forgiveness
    return (
      a.x + margin < b.x + b.w &&
      a.x + a.w - margin > b.x &&
      a.y + margin < b.y + b.h &&
      a.y + a.h - margin > b.y
    );
  }

  function spawnObstacle() {
    const type = Math.random();
    let w, h;
    if (type < 0.65) {
      w = 18; h = 34; // small cactus
    } else if (type < 0.9) {
      w = 26; h = 52; // tall cactus
    } else {
      w = 32; h = 20; // flying rock
    }
    const y = (h === 20)
      ? (GROUND_Y - PLAYER_H - 44) // flying
      : (GROUND_Y - h);            // ground

    obstacles.push({ x: canvas.width + 20, y, w, h, passed: false });
  }

  function speed() {
    return Math.min(350 + score * 4, 950);
  }

  function update(dt) {
    time  += dt;
    score += dt * 10;
    scoreEl.textContent = `Score: ${Math.floor(score)}`;

    checkMilestone();

    // Toast countdown
    if (toastTimer > 0) {
      toastTimer -= dt;
      if (toastTimer <= 0 && toastEl) {
        toastEl.classList.remove("show");
      }
    }

    // Physics
    player.vy += GRAVITY * dt;
    player.y  += player.vy * dt;
    if (player.y >= GROUND_Y - player.h) {
      player.y       = GROUND_Y - player.h;
      player.vy      = 0;
      player.onGround = true;
    }

    // Spawn
    spawnTimer -= dt;
    const interval = Math.max(0.6, 1.35 - score / 800);
    if (spawnTimer <= 0) {
      spawnObstacle();
      spawnTimer = interval + Math.random() * 0.35;
    }

    // Move obstacles
    const vx = speed();
    groundOffset = (groundOffset + vx * dt) % 40;

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      o.x -= vx * dt;
      if (rectsOverlap(player, o)) {
        running = false;
      }
      if (o.x + o.w < -20) {
        obstacles.splice(i, 1);
      }
    }

    if (!running) {
      const s = Math.floor(score);
      if (s > best) {
        best = s;
        localStorage.setItem(bestKey, String(best));
        bestEl.textContent = `Best: ${best}`;
      }
    }
  }

  /* ---------- Drawing helpers ---------- */

  function drawDino(x, y, w, h) {
    const isAir = !player.onGround;
    const bodyColor   = "#1a1a2e";
    const accentColor = "#4f8ef7";

    // Body
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.roundRect(x, y + 6, w, h - 6, 4);
    ctx.fill();

    // Head
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.roundRect(x + w - 14, y, 18, 18, 4);
    ctx.fill();

    // Eye
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(x + w + 1, y + 7, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(x + w + 1, y + 7, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Legs (animated)
    const legPhase = (time * 14) % (Math.PI * 2);
    ctx.fillStyle = bodyColor;
    if (isAir) {
      // both legs tucked
      ctx.fillRect(x + 4, y + h - 6, 8, 8);
      ctx.fillRect(x + 16, y + h - 6, 8, 8);
    } else {
      const l1h = 10 + Math.sin(legPhase) * 4;
      const l2h = 10 + Math.sin(legPhase + Math.PI) * 4;
      ctx.fillRect(x + 4,  y + h - l1h, 8, l1h);
      ctx.fillRect(x + 16, y + h - l2h, 8, l2h);
    }
  }

  function drawCactus(o) {
    const g = ctx.createLinearGradient(o.x, o.y, o.x + o.w, o.y + o.h);
    g.addColorStop(0, "#2d7a3a");
    g.addColorStop(1, "#0f4a1a");
    ctx.fillStyle = g;

    // Main trunk
    ctx.beginPath();
    ctx.roundRect(o.x + 4, o.y, o.w - 8, o.h, 4);
    ctx.fill();

    // Arms (only for tall cactus)
    if (o.h === 52) {
      ctx.fillRect(o.x - 5, o.y + 14, 8, 12);
      ctx.fillRect(o.x - 5, o.y + 10, 5, 6);
      ctx.fillRect(o.x + o.w - 3, o.y + 20, 8, 12);
      ctx.fillRect(o.x + o.w - 2, o.y + 16, 5, 6);
    } else {
      ctx.fillRect(o.x - 4, o.y + 10, 7, 9);
    }
  }

  function drawRock(o) {
    const g = ctx.createLinearGradient(o.x, o.y, o.x + o.w, o.y + o.h);
    g.addColorStop(0, "#555577");
    g.addColorStop(1, "#333344");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(o.x, o.y + 4, o.w, o.h - 4, 6);
    ctx.fill();
    // shine
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(o.x + 5, o.y + 6, o.w - 12, 4);
  }

  function draw() {
    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, "#0d1b2a");
    sky.addColorStop(1, "#1a2a1a");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars (static seed based on canvas size)
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    for (let i = 0; i < 25; i++) {
      const sx = (i * 137 + 41) % canvas.width;
      const sy = (i * 79 + 13) % (GROUND_Y - 20);
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }

    // Ground (scrolling dashes)
    ctx.fillStyle = "#2a3a2a";
    ctx.fillRect(0, GROUND_Y, canvas.width, 3);
    ctx.fillStyle = "#3a4a3a";
    for (let x = -groundOffset; x < canvas.width; x += 40) {
      ctx.fillRect(x, GROUND_Y + 6, 20, 2);
    }

    // Draw obstacles
    for (const o of obstacles) {
      if (o.h === 20) {
        drawRock(o);
      } else {
        drawCactus(o);
      }
    }

    // Draw dino
    drawDino(player.x, player.y, player.w, player.h);

    // Game Over overlay
    if (!running) {
      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#fff";
      ctx.font = "bold 36px Inter, Arial";
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 14);

      ctx.font = "15px Inter, Arial";
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText("Drück R oder klick auf Neustart", canvas.width / 2, canvas.height / 2 + 18);
      ctx.textAlign = "left";
    }
  }

  function loop(ts) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min((ts - lastTs) / 1000, 0.033);
    lastTs = ts;

    if (running) {
      update(dt);
      draw();
      requestAnimationFrame(loop);
    } else {
      draw();
    }
  }

  // Controls
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp") {
      e.preventDefault();
      jump();
    }
    if (e.code === "KeyR") restart();
  });

  canvas.addEventListener("mousedown", () => {
    if (!running) return;
    jump();
  });

  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (!running) return;
    jump();
  }, { passive: false });

  restartBtn.addEventListener("click", restart);

  resetGame();
  requestAnimationFrame(loop);
})();
