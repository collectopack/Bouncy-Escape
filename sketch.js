// Mobile-optimized p5.js game with touch and click support
let ball;
let platform;
let gameOver = false;
let restartTimer = 0;
let score = 0;
let highScore = 0;
let hitEffects = [];
let stars = [];
let showStartMenu = true;
let startMenuTimer;

let bounceOsc, moveOsc, gameOverOsc, musicOsc;
let musicInterval;

let sunPulse = 0;
let sunDirection = 1;

function setup() {
  // ✅ Hide loading bar if it exists
  const loading = document.getElementById("loading");
  if (loading) loading.style.display = "none";

  createCanvas(windowWidth, windowHeight);
  setupSounds();
  startMusicLoop();
  createStars();
  resetGame();
  textFont('monospace');
  startMenuTimer = millis() + 5000; // Auto-start after 5 seconds
}

function draw() {
  drawRetroBackground();

  if (showStartMenu) {
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(30);
    text("Tap or Click to Start", width / 2, height / 2);
    if (millis() > startMenuTimer) {
      showStartMenu = false;
      resetGame();
    }
    return;
  }

  if (!gameOver) {
    ball.update();
    platform.update();
    ball.checkCollision(platform);
    ball.display();
    platform.display();
    drawHitEffects();

    fill(255);
    textSize(20);
    textAlign(LEFT, TOP);
    text("Score: " + score, 10, 10);
    text("High Score: " + highScore, 10, 35);

    if (ball.y - ball.r > height) {
      gameOver = true;
      restartTimer = millis() + 5000; // Restart to menu after 5 seconds
      playGameOverSound();
      if (score > highScore) highScore = score;
    }
  } else {
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(74);
    text("Game Over", width / 2, height / 2 - 40);
    textSize(24);
    text("Score: " + score, width / 2, height / 2);
    text("High Score: " + highScore, width / 2, height / 2 + 40);

    if (millis() > restartTimer) {
      showStartMenu = true;
      startMenuTimer = millis() + 5000;
    }
  }
}

function resetGame() {
  ball = new Ball();
  platform = new Platform();
  score = 0;
  hitEffects = [];
  gameOver = false;
}

class Ball {
  constructor() {
    this.r = 15;
    this.vx = random([-6, 6]);
    this.vy = 0;
    this.gravity = 0.8;
    this.bouncedLastFrame = false;
    this.x = width / 2;
    this.y = 50;
  }

  update() {
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;

    if (this.x - this.r < 0) {
      this.x = this.r;
      this.vx *= -1;
    }
    if (this.x + this.r > width) {
      this.x = width - this.r;
      this.vx *= -1;
    }

    const platformTop = platform.y;
    const withinX = this.x + this.r > platform.x && this.x - this.r < platform.x + platform.w;

    if (withinX && this.y + this.r > platformTop && this.vy > 0) {
      this.y = platformTop - this.r;
      let level = Math.floor(score / 2);
      this.vy = -35 - level * 1.2;
      this.vx = random([-6, -4, 4, 6]) * (1 + level * 0.05);

      if (!this.bouncedLastFrame) {
        score++;
        this.bouncedLastFrame = true;
        playBounceSound();
        triggerHitEffect(this.x, this.y + this.r);
      }
    } else {
      this.bouncedLastFrame = false;
    }
  }

  display() {
    fill(255);
    noStroke();
    ellipse(this.x, this.y, this.r * 2);
  }

  checkCollision() {}
}

class Platform {
  constructor() {
    if (/Mobi|Android/i.test(navigator.userAgent)) {
      this.w = width * 0.3;
    } else {
      this.w = width * 0.14;
    }
    this.h = 10;
    this.y = height - height * 0.15;
    this.x = width / 2 - this.w / 2;
    this.lastX = this.x;
  }

  update() {
    let inputX = touches.length > 0 ? touches[0].x : mouseX;
    let newX = constrain(inputX - this.w / 2, 0, width - this.w);
    if (abs(newX - this.x) > 2) playMoveSound();
    this.lastX = this.x;
    this.x = newX;
  }

  display() {
    fill(173, 216, 230);
    stroke(0);
    strokeWeight(5);
    rect(this.x, this.y, this.w, this.h, 20);
  }
}

function triggerHitEffect(x, y) {
  hitEffects.push({ x, y, radius: 0, alpha: 255 });
}

function drawHitEffects() {
  for (let i = hitEffects.length - 1; i >= 0; i--) {
    let e = hitEffects[i];
    noFill();
    stroke(255, e.alpha);
    strokeWeight(2);
    ellipse(e.x, e.y, e.radius * 2);
    e.radius += 4;
    e.alpha -= 15;
    if (e.alpha <= 0) hitEffects.splice(i, 1);
  }
}

function drawRetroBackground() {
  background(10, 5, 25);
  for (let star of stars) {
    star.display();
    star.update();
  }
  stroke(255, 255, 255, 40);
  strokeWeight(1);
  let spacing = 40;
  for (let y = height / 2; y < height; y += spacing) line(0, y, width, y);
  for (let x = 0; x <= width; x += spacing)
    line(x, height / 2, width / 2 + (x - width / 2) * 2, height);
  sunPulse += 0.1 * sunDirection;
  if (sunPulse > 10 || sunPulse < -10) sunDirection *= -1;
  let sunX = width / 2;
  let sunY = height / 2 - height * 0.12;
  let size = 280 + sunPulse * 2;
  noStroke();
  fill(255, 180, 50, 40);
  ellipse(sunX, sunY, size * 1.5);
  fill(255, 200, 80, 90);
  ellipse(sunX, sunY, size);
  fill(255, 240, 150, 130);
  ellipse(sunX, sunY, size * 0.7);
}

function createStars() {
  for (let i = 0; i < 80; i++) stars.push(new Star());
}

class Star {
  constructor() {
    this.x = random(width);
    this.y = random(height / 2);
    this.size = random(1, 3);
    this.twinkle = random(0.005, 0.015);
    this.alpha = random(100, 255);
    this.alphaDir = random([1, -1]);
  }
  update() {
    this.alpha += this.alphaDir * this.twinkle * 255;
    if (this.alpha > 255 || this.alpha < 100) this.alphaDir *= -1;
  }
  display() {
    noStroke();
    fill(255, this.alpha);
    ellipse(this.x, this.y, this.size);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  stars = [];
  createStars();
  resetGame();
}

function setupSounds() {
  bounceOsc = new p5.Oscillator('square');
  bounceOsc.amp(0);
  bounceOsc.start();
  moveOsc = new p5.Oscillator('triangle');
  moveOsc.amp(0);
  moveOsc.start();
  gameOverOsc = new p5.Oscillator('sine');
  gameOverOsc.amp(0);
  gameOverOsc.start();
  musicOsc = new p5.Oscillator('sawtooth');
  musicOsc.amp(0.05);
  musicOsc.start();
}

function playBounceSound() {
  bounceOsc.freq(400);
  bounceOsc.amp(0.2, 0.05);
  setTimeout(() => bounceOsc.amp(0, 0.05), 50);
}

function playMoveSound() {
  moveOsc.freq(random(200, 300));
  moveOsc.amp(0.1, 0.05);
  setTimeout(() => moveOsc.amp(0, 0.1), 50);
}

function playGameOverSound() {
  gameOverOsc.freq(100);
  gameOverOsc.amp(0.3, 0.1);
  setTimeout(() => gameOverOsc.amp(0, 0.4), 400);
}

function startMusicLoop() {
  let notes = [220, 330, 440, 550, 660];
  let index = 0;
  musicInterval = setInterval(() => {
    musicOsc.freq(notes[index % notes.length]);
    index++;
  }, 300);
}

function touchStarted() {
  if (showStartMenu) {
    showStartMenu = false;
    resetGame();
  }
  if (gameOver) {
    showStartMenu = true;
    startMenuTimer = millis() + 5000;
  }
  resumeAudio();
  return false;
}

function mousePressed() {
  if (showStartMenu) {
    showStartMenu = false;
    resetGame();
  }
  if (gameOver) {
    showStartMenu = true;
    startMenuTimer = millis() + 5000;
  }
  resumeAudio();
}

function resumeAudio() {
  if (getAudioContext().state !== 'running') getAudioContext().resume();
}
