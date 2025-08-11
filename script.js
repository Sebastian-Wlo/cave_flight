const flickerBtn = document.querySelector("#toggle-flicker");
const flickerIndicator = document.querySelector("#flicker-indicator");
const monitor = document.querySelector("#monitor");
const muteBtn = document.querySelector("#toggle-audio");
const mutedIndicator = document.querySelector("#audio-indicator");

let flickerOn = false;
let mutedAudio = false;

document.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "f") {
    toggleFlicker();
  } else if (e.key.toLowerCase() === "m") {
    toggleAudio();
  }
})

flickerBtn.addEventListener("click", () => {
  toggleFlicker();
});

const toggleFlicker = () => {
  flickerOn = !flickerOn;
  if (!flickerOn) {
    flickerIndicator.classList.remove("indicator-on");
    monitor.classList.remove("animation-flicker");
  } else {
    flickerIndicator.classList.add("indicator-on");
    monitor.classList.add("animation-flicker");
  }
};

muteBtn.addEventListener("click", () => {
  toggleAudio();
});

const toggleAudio = () => {
  mutedAudio = !mutedAudio;
  if (!mutedAudio) {
    mutedIndicator.classList.remove("indicator-on");
  } else {
    mutedIndicator.classList.add("indicator-on");
  }
};

const color = {
  blck: "#000000",
  whte: "#ffffff",
  dbrn: "#772d26",
  lbrn: "#b66862",
  dblu: "#85d4dc",
  lblu: "#c5ffff",
  dvlt: "#a85fb4",
  dprp: "#42348b",
  lylw: "#ffffb0",
};

class Player {
  constructor(game) {
    this.game = game;
    this.width = 48;
    this.height = 48;
    this.hitboxWidth = 48;
    this.hitboxHeight = 16;
    this.velocityY = 0;
    this.maxVelocity = 8;
    this.power = 0.3;
    this.xPos = this.game.width / 10;
    this.yPos = this.game.height * 0.5 - this.height * 0.5;
    this.hitboxYpos = this.yPos + this.hitboxHeight;
    this.image = document.querySelector("#spritesheet-bat");
    this.frame = 1;
  }
  draw(context) {
    context.drawImage(
      this.image,
      16 * this.frame,
      0,
      16,
      16,
      this.xPos,
      this.yPos,
      this.width,
      this.height
    );
  }
  update() {
    // Update Y position
    if (this.game.gameStarted && !this.game.gameOver) {
      this.yPos += this.velocityY;
      this.hitboxYpos = this.yPos + this.hitboxHeight;
      if (this.game.inputs.length > 0 && this.game.energy > 0)
        this.velocityY -= this.power;
      else {
        this.velocityY += this.game.gravity;
      }
      if (this.velocityY >= this.maxVelocity) this.velocityY = this.maxVelocity;
      else if (this.velocityY <= this.maxVelocity * -1)
        this.velocityY = this.maxVelocity * -1;
    }
    // Animate Wing movement
    if (this.game.gameFrame % 10 === 0) {
      if (this.game.inputs.length !== 0) {
        if (this.frame === 2) this.frame = 1;
        else this.frame = 2;
      } else {
        this.frame = 0;
      }
    }
  }
  restart() {
    this.yPos = this.game.height * 0.5 - this.height * -0.5;
    this.velocityY = 0;
    this.frame = 1;
  }
}

class Moth {
  constructor(game) {
    this.game = game;
    this.xPos = this.game.width;
    this.yPos = this.game.height * 0.5 - 63 * 0.5;
    this.visible = false;
    this.width = 16;
    this.height = 16;
  }
  draw(context) {
    if (this.visible) {
      context.fillStyle = color["whte"];
      context.fillRect(this.xPos, this.yPos, this.width, this.height);
    }
  }

  update() {
    if (this.visible) {
      this.xPos -= this.game.gameSpeed;

      if (this.game.checkMothCollision(this, this.game.player)) {
        this.game.energy += 384;
        if (this.game.energy > this.game.maxEnergy)
          this.game.energy = this.game.maxEnergy;
        this.visible = false;
        this.game.mothsCaught++;
        if (!mutedAudio) this.game.pickupSound.play();
      }
    }
    if (this.xPos <= 0) {
      this.visible = false;
      this.xpos = this.game.width;
    }
  }
  respawn(height) {
    this.visible = true;
    this.xPos = this.game.width;
    this.yPos = height;
  }
}

class TerrainStrip {
  constructor(game, pos) {
    this.game = game;
    this.width = game.terrainStripWidth;
    this.topHeight = game.tunnelCeiling;
    this.bottomHeight = game.height - game.tunnelHeight - this.topHeight;
    this.xPos = this.game.width - pos;
    this.yPosTop = 0;
    this.yPosBottom = this.game.height - this.bottomHeight;
    this.gap = 120;
  }
  draw(context) {
    context.fillStyle = color["lbrn"];
    context.fillRect(this.xPos, 0, this.width, this.topHeight);
    context.fillRect(this.xPos, this.yPosBottom, this.width, this.bottomHeight);
  }
  update() {
    if (this.xPos <= 0) {
      this.xPos = this.game.width;
      if (this.game.gameStarted && !this.game.gameOver) {
        if (this.game.tunnelCeiling <= 16 || this.game.tunnelCeiling >= 220)
          this.game.tunnelDirection *= -1;
        else {
          let rng = Math.floor(Math.random() * 5);
          if (rng === 1) this.game.tunnelDirection *= -1;
        }

        this.topHeight = this.game.tunnelCeiling +=
          16 * this.game.tunnelDirection;

        this.bottomHeight =
          this.game.height - this.game.tunnelHeight - this.topHeight;
        this.yPosBottom = this.game.height - this.bottomHeight;

        this.game.segmentsCleared++;
        this.game.currentTunnelTop = this.topHeight;
      }
    }
    if (this.game.checkGroundCollision(this, this.game.player)) {
      this.game.gameOver = true;
      this.game.player.frame = 3;
      if (!mutedAudio) this.game.collisionSound.play();
    }
    this.xPos -= this.game.gameSpeed;
  }
}

class Terrain {
  constructor(game) {
    this.game = game;
    this.segments = [];
    if ((this.segments = [])) {
      for (let n = 0; n < 40; n++) {
        this.segments.push(new TerrainStrip(this.game, n * 16));
      }
    }
  }
  draw(context) {
    this.segments.forEach((segment) => {
      segment.draw(context);
    });
  }
  update() {
    this.segments.forEach((segment) => segment.update());
  }
  reset() {
    this.segments = [];
  }
}

class StartScreen {
  constructor(game) {
    this.game = game;
    this.width = 480;
    this.height = 320;
    this.x = this.game.width * 0.5 - this.width * 0.5;
    this.y = this.game.height * 0.5 - this.height * 0.5;

    this.spriteSize = 128;

    this.background = color["lblu"];
    this.shadow = color["dblu"];

    this.titleColor = color["dprp"];
    this.titleFontSize = 64;
    this.titleTabSize = 144;
    this.titleFont = this.titleFontSize + "px 'Vic Twenty'";

    this.descColor = color["blck"];

    this.descFont = this.titleFontSize * 0.5 + "px 'VT323'";
    this.ctaColor = color["dvlt"];

    this.PlayerSprite = document.querySelector("#spritesheet-bat");
    this.SpriteFrame = 1;
    this.cooldownTimer = 0;
  }
  draw(context) {
    context.fillStyle = this.shadow;
    context.fillRect(this.x + 8, this.y + 8, this.width, this.height);
    context.fillStyle = this.background;
    context.fillRect(this.x, this.y, this.width, this.height);

    context.drawImage(
      this.PlayerSprite,
      16 * this.SpriteFrame,
      0,
      16,
      16,
      this.x,
      this.y + 16,
      this.spriteSize,
      this.spriteSize
    );
    if (this.game.gameFrame % 60 === 0) {
      if (this.SpriteFrame === 2) this.SpriteFrame = 1;
      else {
        this.SpriteFrame = 2;
      }
    }

    context.font = this.titleFont;
    context.fillStyle = this.titleColor;
    context.fillText(
      "Cave",
      this.x + this.titleTabSize,
      this.y + this.titleFontSize
    );
    context.fillText(
      "Flight",
      this.x + this.titleTabSize,
      this.y + this.titleFontSize * 2
    );
    context.font = this.descFont;
    context.fillStyle = this.descColor;
    context.fillText("Click on the screen or hold 'space'", 96, 240);
    context.fillText("to go up, avoid the terrain,", 96, 264);
    context.fillText("catch moths to regain energy.", 96, 264 + 24);
    if (this.cooldownTimer >= 90) {
      context.fillStyle = this.ctaColor;
      context.fillRect(96, 264 + 16 + 24, 24 * 18 + 16, 48);
      context.fillStyle = this.background;
      context.fillText("Start", 96 + 128 + 64 + 4, 264 + 16 + 48 + 8);
    }

    context.fillStyle = this.descColor;
    context.fillText("Sebastian Włodarczyk, 2025", 212, 388);
  }
  update() {
    this.cooldownTimer++;
    if (this.cooldownTimer >= 90 && this.game.inputs.length > 0) {
      this.game.gameStarted = true;
      this.game.tunnelHeight = this.game.height * 0.5;
    }
  }
}

class gameOverScreen {
  constructor(game) {
    this.resetReady = false;
    this.game = game;
    this.width = 320;
    this.height = 130;
    this.x = this.game.width * 0.5 - this.width * 0.5;
    this.y = this.game.height * 0.5 - this.height * 0.5;
    this.titleFont = "32px 'Vic Twenty'";
    this.descFont = "32px 'VT323'";
    this.cooldownTimer = 0;
  }
  draw(context) {
    context.fillStyle = color["dblu"];
    context.fillRect(this.x + 8, this.y + 8, this.width, this.height);
    context.fillStyle = color["lblu"];
    context.fillRect(this.x, this.y, this.width, this.height);
    context.fillStyle = color["blck"];
    context.font = this.titleFont;
    context.fillText("GAME OVER", this.x + 56, this.y + 48);
    context.font = this.descFont;
    context.fillText(
      "Score:" + this.game.score,
      this.x + 56 + 16,
      this.y + 64 + 16
    );

    if (this.cooldownTimer >= 90) {
      context.fillStyle = color["dvlt"];
      context.fillRect(this.x + 8, 264, 24 * 12 + 12 + 4, 32);
      context.fillStyle = color["lblu"];
      context.fillText("Play Again?", 96 + 128 + 32, 264 + 16 + 8);
      context.fillStyle = color["whte"];
    }
  }
  update() {
    this.cooldownTimer++;
    if (this.game.inputs.length > 0 && !this.gameStarted) {
      this.game.gameStarted = true;
    }

    if (this.cooldownTimer >= 90 && this.game.inputs.length > 0)
      this.game.resetGame();
  }
}

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.inputs = [];
    this.gameStarted = false;
    this.gameOver = false;

    this.gravity = 0.25;
    this.score = 0;
    this.mothsCaught = 0;
    this.gameSpeed = 4;
    this.player = new Player(this);
    this.moth = new Moth(this);
    this.startScreen = new StartScreen(this);
    this.gameOverScreen = new gameOverScreen(this);

    this.terrainStripWidth = 16;
    this.tunnelHeight = 352;
    this.tunnelCeiling = 64;
    this.tunnelDirection = -1;
    this.terrain = new Terrain(this);
    this.maxEnergy = 512;
    this.energy = this.maxEnergy;

    this.segmentsCleared = 0;
    this.gameFrame = 0;

    this.currentTunnelTop = 0;

    this.pickupSound = document.querySelector("#sound-pickup");
    this.collisionSound = document.querySelector("#sound-collision");

    window.addEventListener("keydown", (e) => {
      if (e.key === " " && this.inputs.indexOf("space") === -1)
        this.inputs.push("space");
    });

    window.addEventListener("keyup", (e) => {
      if (e.key === " ") {
        const index = this.inputs.indexOf("space");
        this.inputs.splice(index, 1);
      }
    });

    window.addEventListener("mousedown", (e) => {
      if (e.buttons === 1 && e.target.id === "game")
        this.inputs.push("leftClick");
    });

    window.addEventListener("mouseup", (e) => {
      if (e.buttons === 0) {
        const index = this.inputs.indexOf("leftClick");
        this.inputs.splice(index, 1);
      }
    });
  }

  resetGame() {
    this.gameStarted = false;
    this.gameOver = false;
    this.score = 0;
    this.mothsCaught = 0;
    this.player = new Player(this);
    this.moth = new Moth(this);
    this.startScreen = new StartScreen(this);
    this.gameOverScreen = new gameOverScreen(this);

    this.tunnelHeight = 352;
    this.tunnelCeiling = 64;
    this.terrain = new Terrain(this);

    this.segmentsCleared = 0;
    this.gameFrame = 0;
    this.energy = this.maxEnergy;
  }
  checkGroundCollision(a, player) {
    return (
      a.xPos < player.xPos + player.hitboxWidth &&
      a.xPos + a.width > player.xPos &&
      // Check for collisions with top terrain
      (a.yPosTop + a.topHeight > player.hitboxYpos ||
        // Check for collisions with bottom terrain
        a.yPosBottom < player.hitboxYpos + player.hitboxHeight)
    );
  }
  checkMothCollision(a, player) {
    return (
      a.xPos <= player.xPos + player.hitboxWidth &&
      a.xPos + a.width >= player.xPos &&
      a.yPos <= player.hitboxYpos + player.hitboxHeight &&
      a.yPos + a.height >= player.hitboxYpos
    );
  }
  render(context) {
    this.terrain.draw(context);
    this.player.draw(context);
    if (!this.gameOver && this.gameStarted) {
      this.player.update();
      this.terrain.update();
      context.fillStyle = color["whte"];
      context.fillText("Score: " + this.score, 32, 32 + 32);
      context.fillText("Energy: ", 32, 32 + 8);
      context.fillStyle = color["lylw"];
      context.fillRect(128, 24, Math.floor(this.energy * 0.25 * 0.25) * 4, 16);
      context.lineWidth = 4;
      context.strokeStyle = color["whte"];
      context.strokeRect(128, 24, 128, 16);

      if (this.inputs.length > 0 && this.energy >= 0) this.energy--;
    }

    if (!this.gameStarted) {
      this.startScreen.draw(context);
      this.startScreen.update();
    }

    if (this.gameOver) {
      this.gameOverScreen.draw(context);
      this.gameOverScreen.update();
    }

    if (!this.gameOver && this.gameStarted) {
      this.moth.draw(context);
      this.moth.update();
      this.score = Math.floor(this.segmentsCleared / 5) + this.mothsCaught * 50;

      if (
        this.segmentsCleared % 80 === 0 &&
        this.segmentsCleared > 0 &&
        !this.moth.visible
      ) {
        let height =
          Math.floor(Math.random() * 46) * 4 + this.currentTunnelTop + 32;
        this.moth.respawn(height);
      }
    }
    this.gameFrame++;
  }
}

window.addEventListener("load", function () {
  const loadingIndicator = document.querySelector("#loading-indicator");
  const canvas = document.querySelector("#game");

  loadingIndicator.remove();
  canvas.style["display"] = "block";

  const ctx = canvas.getContext("2d");
  const CANVAS_WIDTH = (canvas.width = 640);
  const CANVAS_HEIGHT = (canvas.height = 480);

  // Display Pixelart as sharp images
  ctx.imageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.mozImageSmoothingEnabled = false;

  const game = new Game(canvas);

  let lastFrame = 0;
  function animate(timeStamp) {
    const dTime = timeStamp - lastFrame;
    lastFrame = timeStamp;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    game.render(ctx, dTime);

    requestAnimationFrame(animate);
  }
  animate();
});
