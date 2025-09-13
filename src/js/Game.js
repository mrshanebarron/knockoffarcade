/**
 * Complete KnockoffArcade Game - Working Version
 */

import { HighScoreManager } from './systems/HighScoreManager.js';
import { AudioManager } from './systems/AudioManager.js';
import { GameConfig } from './config/GameConfig.js';

export class KnockoffArcade {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.startScreen = document.getElementById('startScreen');
    this.gameOverScreen = document.getElementById('gameOver');
    this.scoreElement = document.getElementById('scoreValue');
    this.livesElement = document.getElementById('livesValue');
    this.finalScoreElement = document.getElementById('finalScore');
    this.gameOverTitle = document.getElementById('gameOverTitle');
    this.levelElement = document.getElementById('levelValue');
    this.multiplierElement = document.getElementById('multiplierValue');
    this.comboElement = document.getElementById('comboValue');
    this.comboDisplay = document.getElementById('comboDisplay');
    this.powerupDisplay = document.getElementById('powerupDisplay');
    this.playerNameInput = document.getElementById('playerName');
    this.startButton = document.querySelector('.saloon-door-btn');
    this.highScoresScreen = document.getElementById('highScoresScreen');
    this.highScoresList = document.getElementById('highScoresList');

    this.gameState = 'start';
    this.score = 0;
    this.lives = 10;
    this.level = 1;
    this.combo = 0;
    this.multiplier = 1;
    this.balls = [];
    this.bricks = [];
    this.powerUps = [];
    this.particles = [];
    this.cavityBalls = new Set(); // Track balls in the cavity (above bricks)
    this.cavityTimers = new Map(); // Track cavity effect timers for balls
    this.originalSpeeds = new Map(); // Track original speeds for cavity balls
    this.keys = {};

    // Initialize high score manager
    this.highScoreManager = new HighScoreManager();
    this.displayHighScores();

    // Initialize audio manager and start music after first user interaction
    this.audioManager = new AudioManager();
    this.musicStarted = false;

    // Load background image
    this.backgroundImage = new Image();
    this.backgroundImage.src = './assets/img/background.webp';

    // Load power-up icons
    this.powerUpIcons = {};
    this.loadPowerUpIcons();
    this.backgroundImageLoaded = false;
    this.backgroundImage.onload = () => {
      this.backgroundImageLoaded = true;
    };

    this.resizeCanvas();
    this.initializeGame();
    this.setupEventListeners();
    this.gameLoop();
  }

  async init() {
    // Already initialized in constructor
    return Promise.resolve();
  }

  resizeCanvas() {
    // Get viewport dimensions, accounting for mobile specifics
    let canvasWidth = window.innerWidth;
    let canvasHeight = window.innerHeight;

    // For mobile devices, use visual viewport if available
    if (window.visualViewport) {
      canvasWidth = window.visualViewport.width;
      canvasHeight = window.visualViewport.height;
    }

    // Account for mobile browsers hiding/showing address bar
    if (GameConfig.MOBILE) {
      // Use screen dimensions on mobile for more stable sizing
      canvasHeight = Math.min(window.innerHeight, window.screen.height - 100);
    }

    // Ensure minimum dimensions for playability
    const minDimension = GameConfig.CANVAS.MIN_DIMENSION || 400;
    canvasWidth = Math.max(canvasWidth, minDimension);
    canvasHeight = Math.max(canvasHeight, minDimension);

    this.canvas.width = canvasWidth;
    this.canvas.height = canvasHeight;

    // Set CSS dimensions to match canvas dimensions for proper scaling
    this.canvas.style.width = canvasWidth + 'px';
    this.canvas.style.height = canvasHeight + 'px';

    // Debounced resize handler to avoid excessive recalculations
    if (!this.resizeTimeout) {
      window.addEventListener('resize', () => {
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
          this.resizeCanvas();
          this.initializeGame();
        }, 250);
      });

      // Handle visual viewport changes on mobile
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => {
          clearTimeout(this.resizeTimeout);
          this.resizeTimeout = setTimeout(() => {
            this.resizeCanvas();
            this.initializeGame();
          }, 250);
        });
      }
    }
  }

  handleResize() {
    this.resizeCanvas();
  }

  initializeGame() {
    const scale = Math.min(this.canvas.width, this.canvas.height) / 800;
    
    this.paddle = {
      x: this.canvas.width / 2 - 60 * scale,
      y: this.canvas.height - 50 * scale,
      width: 120 * scale,
      height: 15 * scale,
      speed: 8 * scale,
      powerUps: {}
    };

    this.ball = {
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      radius: 12 * scale,
      speedX: 2 * scale,
      speedY: -2 * scale,
      powerUps: {}
    };

    this.balls = [this.ball];
    this.createBricks();
  }

  createBricks() {
    this.bricks = [];
    const scale = Math.min(this.canvas.width, this.canvas.height) / 800;
    const brickWidth = 75 * scale;
    const brickHeight = 20 * scale;
    const padding = 5 * scale;
    const rows = 8;
    const cols = Math.floor((this.canvas.width - padding * 2) / (brickWidth + padding));
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        this.bricks.push({
          x: padding + col * (brickWidth + padding),
          y: padding + 100 * scale + row * (brickHeight + padding),
          width: brickWidth,
          height: brickHeight,
          visible: true,
          hits: 1,
          color: this.getBrickColor(row)
        });
      }
    }
  }

  loadPowerUpIcons() {
    const iconPath = './assets/images/powerups/';
    const iconMappings = {
      'dynamite': 'cactus.svg',          // Multi-ball power-up
      'sheriff_badge': 'badge.svg',       // Destructive power-up
      'horseshoe': 'hat.svg',            // Slow-motion power-up
      'boots': 'boot-and-spur.svg',      // Maximum speed boost power-up (boot-with-spur as requested)
      'whiskey': 'whiskybottle.svg'      // Paddle width increase power-up
    };

    for (const [powerUpType, iconFile] of Object.entries(iconMappings)) {
      const img = new Image();
      img.src = iconPath + iconFile;
      this.powerUpIcons[powerUpType] = img;
    }
  }


  getBrickColor(row) {
    const colors = ['#dc143c', '#ff6600', '#ffd700', '#00ff7f', '#00ffff', '#8a2be2', '#ff69b4', '#deb887'];
    return colors[row % colors.length];
  }

  setupEventListeners() {
    // Start music on any user interaction
    const startMusicOnInteraction = async () => {
      if (!this.musicStarted) {
        this.musicStarted = true;
        await this.audioManager.startBackgroundMusic();
        console.log('Background music started');
      }
    };

    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      startMusicOnInteraction();
      
      if (e.code === 'Space') {
        e.preventDefault();
        if (this.gameState === 'start') {
          const playerName = this.playerNameInput.value.trim();
          if (playerName.length === 0) {
            // Shake the input field and play error sound
            this.playerNameInput.style.border = '3px solid #dc143c';
            this.playerNameInput.placeholder = 'ENTER YER NAME, PARTNER!';
            this.audioManager.playSound('ballLost'); // Use error sound
            setTimeout(() => {
              this.playerNameInput.style.border = '';
              this.playerNameInput.placeholder = 'ENTER YER NAME';
            }, 2000);
            return;
          }
          this.audioManager.playSound('menuConfirm');
          this.startGame();
        } else if (this.gameState === 'gameOver') {
          this.audioManager.playSound('menuConfirm');
          this.resetGame();
        } else if (this.gameState === 'highScores') {
          this.audioManager.playSound('menuSelect');
          this.hideHighScores();
        }
      } else if (e.code === 'KeyH') {
        // Don't intercept if input is focused
        if (document.activeElement !== this.playerNameInput) {
          e.preventDefault();
          if (this.gameState === 'gameOver' || this.gameState === 'start') {
            this.audioManager.playSound('menuSelect');
            this.showHighScores();
          }
        }
      } else if (e.code === 'KeyM') {
        // Don't intercept if input is focused
        if (document.activeElement !== this.playerNameInput) {
          e.preventDefault();
          this.audioManager.toggleMute();
        }
      } else if (e.code === 'KeyS') {
        // Don't intercept if input is focused
        if (document.activeElement !== this.playerNameInput) {
          e.preventDefault();
          this.audioManager.playNextTrackManual();
          this.audioManager.playSound('menuSelect'); // Play Western sound effect
        }
      }
    });

    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Mouse controls
    this.canvas.addEventListener('mousemove', (e) => {
      if (this.gameState === 'playing') {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        this.paddle.x = mouseX - this.paddle.width / 2;

        // Keep paddle in bounds
        if (this.paddle.x < 0) this.paddle.x = 0;
        if (this.paddle.x + this.paddle.width > this.canvas.width) {
          this.paddle.x = this.canvas.width - this.paddle.width;
        }
      }
    });

    // Touch controls for mobile
    if (GameConfig.TOUCH_ENABLED) {
      // Prevent default touch behaviors on canvas
      this.canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
      this.canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
      this.canvas.addEventListener('touchend', (e) => e.preventDefault(), { passive: false });

      // Touch move for paddle control
      this.canvas.addEventListener('touchmove', (e) => {
        if (this.gameState === 'playing' && e.touches.length > 0) {
          const rect = this.canvas.getBoundingClientRect();
          const touch = e.touches[0];
          const touchX = touch.clientX - rect.left;
          this.paddle.x = touchX - this.paddle.width / 2;

          // Keep paddle in bounds
          if (this.paddle.x < 0) this.paddle.x = 0;
          if (this.paddle.x + this.paddle.width > this.canvas.width) {
            this.paddle.x = this.canvas.width - this.paddle.width;
          }
        }
      }, { passive: false });

      // Touch tap for starting game and menu interactions
      this.canvas.addEventListener('touchstart', (e) => {
        if (this.gameState === 'start' || this.gameState === 'gameOver') {
          // Touch to start game
          if (this.gameState === 'start') {
            const playerName = this.playerNameInput.value.trim();
            if (playerName.length === 0) {
              // Shake the input field and play error sound
              this.playerNameInput.style.border = '3px solid #dc143c';
              this.playerNameInput.placeholder = 'ENTER YER NAME, PARTNER!';
              this.audioManager.playSound('ballLost'); // Use error sound
              setTimeout(() => {
                this.playerNameInput.style.border = '';
                this.playerNameInput.placeholder = 'TYPE HERE...';
              }, 2000);
              return;
            }
            this.audioManager.playSound('menuConfirm');
            this.startGame();
          } else if (this.gameState === 'gameOver') {
            this.audioManager.playSound('menuConfirm');
            this.resetGame();
          }
        } else if (this.gameState === 'playing' && e.touches.length > 0) {
          // Set paddle position on touch start
          const rect = this.canvas.getBoundingClientRect();
          const touch = e.touches[0];
          const touchX = touch.clientX - rect.left;
          this.paddle.x = touchX - this.paddle.width / 2;

          // Keep paddle in bounds
          if (this.paddle.x < 0) this.paddle.x = 0;
          if (this.paddle.x + this.paddle.width > this.canvas.width) {
            this.paddle.x = this.canvas.width - this.paddle.width;
          }
        }
      }, { passive: false });
    }

    // Also start music on click or input events
    document.addEventListener('click', startMusicOnInteraction);
    document.addEventListener('input', startMusicOnInteraction);

    // Setup start button functionality
    this.setupStartButton();

    // Initialize mobile controls
    this.initializeMobileControls();
  }

  setupStartButton() {
    if (!this.startButton || !this.playerNameInput) {
      console.warn('Start button or player name input not found');
      return;
    }

    // Function to check if button should be enabled
    const updateButtonState = () => {
      const playerName = this.playerNameInput.value.trim();
      if (playerName.length > 0) {
        this.startButton.disabled = false;
        this.startButton.classList.remove('disabled');
        if (GameConfig.MOBILE) {
          this.startButton.querySelector('.btn-subtext').textContent = 'Touch to enter';
        } else {
          this.startButton.querySelector('.btn-subtext').textContent = 'Press SPACE when ready';
        }
      } else {
        this.startButton.disabled = true;
        this.startButton.classList.add('disabled');
        this.startButton.querySelector('.btn-subtext').textContent = 'Enter name first';
      }
    };

    // Listen for input changes
    this.playerNameInput.addEventListener('input', updateButtonState);
    this.playerNameInput.addEventListener('keyup', updateButtonState);

    // Handle button click/touch
    this.startButton.addEventListener('click', (e) => {
      e.preventDefault();
      if (!this.startButton.disabled && this.gameState === 'start') {
        const playerName = this.playerNameInput.value.trim();
        if (playerName.length > 0) {
          this.audioManager.playSound('menuConfirm');
          this.startGame();
        }
      }
    });

    // Handle touch events for mobile
    this.startButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (!this.startButton.disabled && this.gameState === 'start') {
        const playerName = this.playerNameInput.value.trim();
        if (playerName.length > 0) {
          this.audioManager.playSound('menuConfirm');
          this.startGame();
        }
      }
    });

    // Initial button state
    updateButtonState();
  }

  startGame() {
    this.gameState = 'playing';
    this.startScreen.classList.add('hidden');
    this.gameOverScreen.classList.add('hidden');
    document.body.classList.add('playing');
    this.showMobileControls();
    this.start();
  }

  resetGame() {
    this.score = 0;
    this.lives = 10;
    this.level = 1;
    this.combo = 0;
    this.multiplier = 1;
    this.gameState = 'start';
    this.startScreen.classList.remove('hidden');
    this.gameOverScreen.classList.add('hidden');
    document.body.classList.remove('playing');
    this.initializeGame();
  }

  start() {
    this.gameStarted = true;
    this.lastTime = performance.now();
    // Music is already started on user interaction
  }

  pause() {
    this.gameStarted = false;
  }

  resume() {
    this.gameStarted = true;
    this.lastTime = performance.now();
  }

  togglePause() {
    if (this.gameStarted) {
      this.pause();
    } else {
      this.resume();
    }
  }

  gameLoop() {
    const currentTime = performance.now();
    
    if (this.gameStarted) {
      this.update();
      this.render();
    }
    
    this.lastTime = currentTime;
    requestAnimationFrame(() => this.gameLoop());
  }

  update() {
    if (this.gameState !== 'playing') return;

    this.updatePaddle();
    this.updateBalls();
    this.updatePowerUps();
    this.updateParticles();
    this.checkCollisions();
    this.checkGameState();
    this.updateUI();
  }

  updatePaddle() {
    // Keyboard controls
    if (this.keys.ArrowLeft || this.keys.KeyA) {
      if (this.paddle.x > 0) {
        this.paddle.x -= this.paddle.speed;
      }
    }
    if (this.keys.ArrowRight || this.keys.KeyD) {
      if (this.paddle.x < this.canvas.width - this.paddle.width) {
        this.paddle.x += this.paddle.speed;
      }
    }
  }

  updateBalls() {
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const ball = this.balls[i];

      // Update position
      ball.x += ball.speedX;
      ball.y += ball.speedY;

      // Check if ball is in cavity (above top row of bricks)
      const topBrickY = 80; // Where bricks start
      const wasInCavity = this.cavityBalls.has(ball);
      const isInCavity = ball.y < topBrickY;

      if (isInCavity && !wasInCavity) {
        // Ball just entered cavity!
        this.cavityBalls.add(ball);
        this.score += 50; // Cavity entry bonus
        this.createParticles(ball.x, ball.y, '#ffd700', 8); // Gold particles

        // Store original speed and increase ball speed (SuperBreakout style!)
        this.originalSpeeds.set(ball, {
          speedX: ball.speedX,
          speedY: ball.speedY
        });
        ball.speedX *= 1.8; // 80% speed increase
        ball.speedY *= 1.8;
        console.log('Ball entered cavity! Speed increased and bonus points awarded.');
      } else if (!isInCavity && wasInCavity) {
        // Ball left cavity - start golden effect timer
        this.cavityBalls.delete(ball);
        this.cavityTimers.set(ball, Date.now() + 5000); // Golden effect lasts 5 seconds after leaving cavity
        console.log('Ball left cavity - golden effect continues for 5 seconds');
      }

      // Check if cavity timer has expired
      if (this.cavityTimers.has(ball)) {
        if (Date.now() > this.cavityTimers.get(ball)) {
          this.cavityTimers.delete(ball);

          // Restore original speed when cavity effect expires
          if (this.originalSpeeds.has(ball)) {
            const originalSpeed = this.originalSpeeds.get(ball);
            ball.speedX = originalSpeed.speedX;
            ball.speedY = originalSpeed.speedY;
            this.originalSpeeds.delete(ball);
            console.log('Golden cavity effect expired - speed restored to normal');
          } else {
            console.log('Golden cavity effect expired for ball');
          }
        }
      }

      // Wall collisions
      if (ball.x <= ball.radius || ball.x >= this.canvas.width - ball.radius) {
        ball.speedX = -ball.speedX;
      }
      if (ball.y <= ball.radius) {
        ball.speedY = -ball.speedY;
      }

      // Bottom boundary - lose ball
      if (ball.y >= this.canvas.height - ball.radius) {
        this.balls.splice(i, 1);
        this.cavityBalls.delete(ball); // Remove from cavity tracking
        this.cavityTimers.delete(ball); // Remove cavity timer
        this.originalSpeeds.delete(ball); // Remove speed tracking
        this.createParticles(ball.x, ball.y, '#ff0000', 10);
        this.audioManager.playSound('ballLost');
      }
    }
    
    // Check if all balls are lost
    if (this.balls.length === 0) {
      this.lives--;
      if (this.lives <= 0) {
        this.gameOver();
      } else {
        this.resetBall();
      }
    }
  }

  updatePowerUps() {
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const powerUp = this.powerUps[i];
      powerUp.y += 2; // Fall speed
      
      // Remove if off screen
      if (powerUp.y > this.canvas.height) {
        this.powerUps.splice(i, 1);
        continue;
      }
      
      // Check collision with paddle
      if (powerUp.x < this.paddle.x + this.paddle.width &&
          powerUp.x + powerUp.width > this.paddle.x &&
          powerUp.y < this.paddle.y + this.paddle.height &&
          powerUp.y + powerUp.height > this.paddle.y) {
        
        this.applyPowerUp(powerUp.type);
        this.powerUps.splice(i, 1);
        this.createParticles(powerUp.x, powerUp.y, powerUp.color, 15);
        this.score += 250;
        this.audioManager.playSound('powerUpCollect');
      }
    }
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= particle.decay;
      
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  checkCollisions() {
    for (let ball of this.balls) {
      // Paddle collision
      if (ball.y + ball.radius >= this.paddle.y &&
          ball.x >= this.paddle.x &&
          ball.x <= this.paddle.x + this.paddle.width &&
          ball.speedY > 0) {
        
        const hitPos = (ball.x - (this.paddle.x + this.paddle.width / 2)) / (this.paddle.width / 2);
        ball.speedX = hitPos * 5;
        ball.speedY = -Math.abs(ball.speedY);
        this.audioManager.playSound('paddleHit');
      }
      
      // Brick collisions
      for (let brick of this.bricks) {
        if (!brick.visible) continue;
        
        if (ball.x >= brick.x &&
            ball.x <= brick.x + brick.width &&
            ball.y >= brick.y &&
            ball.y <= brick.y + brick.height) {
          
          this.hitBrick(brick, ball);
          break;
        }
      }
    }
  }

  hitBrick(brick, ball) {
    const bricksHit = [];
    
    // Check if ball has spike power-up (and it hasn't expired)
    const hasSpike = ball.powerUps.spike && ball.powerUps.spike > Date.now();
    
    if (hasSpike) {
      // Find up to 3 bricks in the direction of ball movement
      bricksHit.push(brick);
      
      const direction = { x: Math.sign(ball.speedX), y: Math.sign(ball.speedY) };
      let currentBrick = brick;
      
      // Find next 2 bricks in the movement direction
      for (let i = 0; i < 2; i++) {
        const nextBrick = this.findNextBrick(currentBrick, direction);
        if (nextBrick && nextBrick.visible) {
          bricksHit.push(nextBrick);
          currentBrick = nextBrick;
        } else {
          break;
        }
      }
    } else {
      bricksHit.push(brick);
    }
    
    // Process all hit bricks
    bricksHit.forEach(hitBrick => {
      hitBrick.visible = false;

      // Add score with cavity bonus
      let points = 100 * this.multiplier;
      const ballInCavity = this.cavityBalls.has(ball) || this.cavityTimers.has(ball);
      if (ballInCavity) {
        points *= 2; // Double points for cavity shots!
        console.log('Cavity shot! Double points!');
      }
      this.score += points;

      this.combo++;
      this.audioManager.playBrickBreak();
      this.audioManager.playComboSound(this.combo);
      
      // Create particles (extra for cavity shots)
      const particleCount = hasSpike ? 15 : (ballInCavity ? 15 : 10);
      const particleColor = ballInCavity ? '#ffd700' : hitBrick.color; // Gold for cavity shots
      this.createParticles(hitBrick.x + hitBrick.width / 2, hitBrick.y + hitBrick.height / 2, particleColor, particleCount);
      
      // Random power-up drop (only from first brick) - reduced spawn rate and limit total powerups
      if (hitBrick === brick && Math.random() < 0.08 && this.powerUps.length < 2) {
        this.createPowerUp(hitBrick.x + hitBrick.width / 2, hitBrick.y + hitBrick.height / 2);
      }
    });
    
    // Update multiplier
    if (this.combo > 5) {
      this.multiplier = Math.min(5, Math.floor(this.combo / 5) + 1);
    }
    
    // Only reverse ball direction if not spiked or if it's the last brick in the chain
    if (!hasSpike) {
      ball.speedY = -ball.speedY;
    }
  }

  checkGameState() {
    const remainingBricks = this.bricks.filter(brick => brick.visible);
    if (remainingBricks.length === 0) {
      this.levelComplete();
    }
  }

  levelComplete() {
    this.level++;
    this.combo = 0;
    this.multiplier = 1;
    
    const levelBonus = this.level * 1000;
    this.score += levelBonus;
    this.audioManager.playSound('levelComplete');
    
    this.createBricks();
    this.resetBall();
  }

  resetBall() {
    const scale = Math.min(this.canvas.width, this.canvas.height) / 800;
    this.ball.x = this.canvas.width / 2;
    this.ball.y = this.canvas.height / 2;
    this.ball.speedX = (Math.random() > 0.5 ? 1 : -1) * 2 * scale;
    this.ball.speedY = -2 * scale;

    // Reset ball power-ups
    this.ball.powerUps = {};

    // Reset paddle power-ups
    this.paddle.powerUps = {};

    // Reset paddle size to normal if it was widened
    this.paddle.width = 120 * scale;

    this.balls = [this.ball];
  }

  async gameOver() {
    this.gameState = 'gameOver';
    document.body.classList.remove('playing');
    this.hideMobileControls();
    this.audioManager.playSound('gameOver');
    
    // Check if it's a high score
    if (this.highScoreManager.isHighScore(this.score)) {
      const playerName = this.playerNameInput.value.trim() || 'OUTLAW';
      const rank = this.highScoreManager.addHighScore(playerName, this.score, this.level);
      
      this.gameOverTitle.textContent = `NEW HIGH SCORE! RANK #${rank}`;
      this.gameOverTitle.classList.add('win');
      
      // Update high scores display
      this.displayHighScores();
    } else {
      this.gameOverTitle.textContent = 'GAME OVER';
      this.gameOverTitle.classList.remove('win');
    }
    
    this.gameOverScreen.classList.remove('hidden');
    this.finalScoreElement.textContent = `Final Score: ${this.score.toLocaleString()}`;
  }

  createParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        color: color,
        size: Math.random() * 4 + 2,
        life: 1,
        decay: Math.random() * 0.02 + 0.01
      });
    }
  }

  createPowerUp(x, y) {
    const types = ['dynamite', 'whiskey', 'horseshoe', 'boots', 'sheriff_badge'];
    const colors = ['#8b4513', '#d2691e', '#c0c0c0', '#654321', '#ffd700'];
    const typeIndex = Math.floor(Math.random() * types.length);
    
    this.powerUps.push({
      x: x - 30, // Adjusted for larger powerup (half of 60)
      y: y,
      width: 60,  // 3 times larger (was 20), 1:1 aspect ratio
      height: 60, // 3 times larger (was 20), 1:1 aspect ratio
      type: types[typeIndex],
      color: colors[typeIndex]
    });
  }

  applyPowerUp(type) {
    switch (type) {
      case 'dynamite':
        // Multi-ball explosion
        if (this.balls.length < 5) {
          const newBall = { ...this.ball };
          newBall.speedX = -newBall.speedX;
          // Inherit power-ups from the original ball
          newBall.powerUps = { ...this.ball.powerUps };
          this.balls.push(newBall);
        }
        break;
      case 'whiskey':
        // Makes paddle wider (liquid courage)
        this.paddle.width *= 1.5;
        break;
      case 'boots':
        // Speed boost (faster movement)
        this.balls.forEach(ball => {
          ball.speedX *= 1.5;
          ball.speedY *= 1.5;
        });
        break;
      case 'sheriff_badge':
        // Gives ball destructive power (like spike)
        this.balls.forEach(ball => {
          ball.powerUps.spike = Date.now() + 10000; // 10 second timeout
        });
        this.audioManager.startSpikeMusic();
        break;
      case 'horseshoe':
        // Lucky charm - slows things down
        this.balls.forEach(ball => {
          ball.speedX *= 0.5;
          ball.speedY *= 0.5;
        });
        break;
    }
  }

  updateUI() {
    if (this.scoreElement) this.scoreElement.textContent = this.score.toLocaleString();
    if (this.livesElement) this.livesElement.textContent = this.lives;
    if (this.levelElement) this.levelElement.textContent = `LEVEL ${this.level}`;
    if (this.comboElement) this.comboElement.textContent = this.combo;
    if (this.multiplierElement) this.multiplierElement.textContent = `x${this.multiplier}`;
  }

  render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw background image if loaded
    if (this.backgroundImageLoaded) {
      this.ctx.drawImage(this.backgroundImage, 0, 0, this.canvas.width, this.canvas.height);
    } else {
      // Fallback solid color background
      this.ctx.fillStyle = '#2d1810';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Draw bricks (rough cut wood style)
    for (let brick of this.bricks) {
      if (brick.visible) {
        this.drawWoodBrick(brick);
      }
    }

    // Draw paddle
    const gradient = this.ctx.createLinearGradient(
      this.paddle.x, this.paddle.y,
      this.paddle.x, this.paddle.y + this.paddle.height
    );
    gradient.addColorStop(0, '#deb887');
    gradient.addColorStop(0.5, '#8b7355');
    gradient.addColorStop(1, '#654321');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);

    // Draw balls
    for (let ball of this.balls) {
      const hasSpike = ball.powerUps.spike && ball.powerUps.spike > Date.now();
      
      if (hasSpike) {
        // Draw spiked ball
        this.ctx.fillStyle = '#ff6600';
        this.ctx.strokeStyle = '#ff3300';
        this.ctx.lineWidth = 2;
        
        // Draw spikes around the ball
        this.ctx.beginPath();
        const spikes = 8;
        for (let i = 0; i < spikes; i++) {
          const angle = (i * Math.PI * 2) / spikes;
          const innerX = ball.x + Math.cos(angle) * ball.radius * 0.7;
          const innerY = ball.y + Math.sin(angle) * ball.radius * 0.7;
          const outerX = ball.x + Math.cos(angle) * ball.radius * 1.3;
          const outerY = ball.y + Math.sin(angle) * ball.radius * 1.3;
          
          if (i === 0) {
            this.ctx.moveTo(innerX, innerY);
          } else {
            this.ctx.lineTo(innerX, innerY);
          }
          this.ctx.lineTo(outerX, outerY);
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // Draw inner ball
        this.ctx.fillStyle = '#ffaa00';
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius * 0.6, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        // Check if ball is in cavity or has active cavity timer for special glow effect
        const inCavity = this.cavityBalls.has(ball) || this.cavityTimers.has(ball);

        if (inCavity) {
          // Draw golden glow for cavity balls
          this.ctx.shadowBlur = 15;
          this.ctx.shadowColor = '#ffd700';

          const cavityGradient = this.ctx.createRadialGradient(
            ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, 0,
            ball.x, ball.y, ball.radius
          );
          cavityGradient.addColorStop(0, '#fff700');
          cavityGradient.addColorStop(0.4, '#ffd700');
          cavityGradient.addColorStop(1, '#cc9900');

          this.ctx.fillStyle = cavityGradient;
        } else {
          // Draw normal ball
          const ballGradient = this.ctx.createRadialGradient(
            ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, 0,
            ball.x, ball.y, ball.radius
          );
          ballGradient.addColorStop(0, '#c0c0c0');
          ballGradient.addColorStop(0.4, '#808080');
          ballGradient.addColorStop(1, '#404040');

          this.ctx.fillStyle = ballGradient;
        }

        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Clear shadow effect
        this.ctx.shadowBlur = 0;
        this.ctx.shadowColor = 'transparent';
      }
    }

    // Draw power-ups using Western icons
    for (let powerUp of this.powerUps) {
      this.ctx.save();

      // Use icon if available, otherwise fallback to simple shape
      const icon = this.powerUpIcons[powerUp.type];
      if (icon && icon.complete) {
        // Draw the Western icon
        this.ctx.drawImage(icon, powerUp.x, powerUp.y, powerUp.width, powerUp.height);
      } else {
        // Fallback to colored circle
        this.ctx.fillStyle = powerUp.color;
        this.ctx.beginPath();
        this.ctx.arc(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2, powerUp.width/2, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    }

    // Draw particles
    for (let particle of this.particles) {
      this.ctx.globalAlpha = particle.life;
      this.ctx.fillStyle = particle.color;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    this.ctx.globalAlpha = 1;
  }

  drawWoodBrick(brick) {
    const ctx = this.ctx;
    const { x, y, width, height, color } = brick;

    // Create wood base color (darker version of the main color)
    const woodColor = this.darkenColor(color, 0.3);

    // Fill base with wood color
    ctx.fillStyle = woodColor;
    ctx.fillRect(x, y, width, height);

    // Add wood grain texture with random lines
    ctx.strokeStyle = this.darkenColor(woodColor, 0.2);
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.6;

    // Draw horizontal wood grain lines
    const grainLines = Math.floor(height / 3);
    for (let i = 0; i < grainLines; i++) {
      const lineY = y + (i + 1) * (height / (grainLines + 1));
      const variance = Math.random() * 2 - 1; // Random variance for rough look

      ctx.beginPath();
      ctx.moveTo(x + 2, lineY + variance);

      // Create wavy grain line
      for (let px = 0; px <= width - 4; px += 4) {
        const waveY = lineY + variance + Math.sin((px / width) * Math.PI * 2) * 0.5;
        ctx.lineTo(x + 2 + px, waveY);
      }
      ctx.stroke();
    }

    ctx.globalAlpha = 1;

    // Add paint overlay with worn edges
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.7;

    // Paint doesn't cover the entire brick (worn/chipped look)
    const paintInset = 1;
    ctx.fillRect(
      x + paintInset,
      y + paintInset,
      width - paintInset * 2,
      height - paintInset * 2
    );

    ctx.globalAlpha = 1;

    // Add rough edges and weathering
    ctx.strokeStyle = this.darkenColor(color, 0.4);
    ctx.lineWidth = 1;

    // Draw rough wooden edges
    ctx.beginPath();

    // Top edge (slightly uneven)
    ctx.moveTo(x, y);
    for (let i = 0; i <= width; i += 2) {
      const roughness = Math.random() * 0.5;
      ctx.lineTo(x + i, y + roughness);
    }

    // Right edge
    for (let i = 0; i <= height; i += 2) {
      const roughness = Math.random() * 0.5;
      ctx.lineTo(x + width - roughness, y + i);
    }

    // Bottom edge
    for (let i = width; i >= 0; i -= 2) {
      const roughness = Math.random() * 0.5;
      ctx.lineTo(x + i, y + height - roughness);
    }

    // Left edge
    for (let i = height; i >= 0; i -= 2) {
      const roughness = Math.random() * 0.5;
      ctx.lineTo(x + roughness, y + i);
    }

    ctx.closePath();
    ctx.stroke();

    // Add nail holes or imperfections
    if (Math.random() < 0.3) {
      ctx.fillStyle = this.darkenColor(woodColor, 0.5);
      const nailX = x + 2 + Math.random() * (width - 4);
      const nailY = y + 2 + Math.random() * (height - 4);
      ctx.beginPath();
      ctx.arc(nailX, nailY, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Add highlight on top edge for 3D effect
    ctx.strokeStyle = this.lightenColor(color, 0.3);
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(x + 1, y + 1);
    ctx.lineTo(x + width - 1, y + 1);
    ctx.stroke();

    // Add shadow on bottom edge
    ctx.strokeStyle = this.darkenColor(woodColor, 0.3);
    ctx.beginPath();
    ctx.moveTo(x + 1, y + height - 1);
    ctx.lineTo(x + width - 1, y + height - 1);
    ctx.stroke();

    ctx.globalAlpha = 1;
  }

  darkenColor(color, factor) {
    // Convert hex to RGB and darken
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - factor));
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - factor));
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - factor));

    return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
  }

  lightenColor(color, factor) {
    // Convert hex to RGB and lighten
    const hex = color.replace('#', '');
    const r = Math.min(255, parseInt(hex.substr(0, 2), 16) * (1 + factor));
    const g = Math.min(255, parseInt(hex.substr(2, 2), 16) * (1 + factor));
    const b = Math.min(255, parseInt(hex.substr(4, 2), 16) * (1 + factor));

    return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
  }

  getGameState() {
    return {
      score: this.score,
      lives: this.lives,
      level: this.level,
      combo: this.combo,
      multiplier: this.multiplier,
      gameState: this.gameState
    };
  }

  displayHighScores() {
    if (this.highScoresList) {
      this.highScoresList.innerHTML = this.highScoreManager.generateHighScoresHTML();
    }
  }

  initializeMobileControls() {
    // Get mobile control elements
    this.mobileControls = document.getElementById('mobileControls');
    this.skipSongBtn = document.getElementById('skipSongBtn');

    if (!this.mobileControls || !this.skipSongBtn) {
      console.warn('Mobile control elements not found');
      return;
    }

    // Show mobile controls only on mobile devices
    if (GameConfig.MOBILE) {
      // Skip song button functionality
      this.skipSongBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.audioManager.playNextTrackManual();
        this.audioManager.playSound('menuSelect');
      });

      this.skipSongBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.audioManager.playNextTrackManual();
        this.audioManager.playSound('menuSelect');
      });
    }
  }

  showMobileControls() {
    if (GameConfig.MOBILE && this.mobileControls) {
      this.mobileControls.classList.remove('hidden');
    }
  }

  hideMobileControls() {
    if (this.mobileControls) {
      this.mobileControls.classList.add('hidden');
    }
  }

  showHighScores() {
    this.gameState = 'highScores';
    this.startScreen.classList.add('hidden');
    this.gameOverScreen.classList.add('hidden');
    this.highScoresScreen.classList.remove('hidden');
    this.displayHighScores();
  }

  hideHighScores() {
    this.highScoresScreen.classList.add('hidden');
    this.gameState = 'start';
    this.startScreen.classList.remove('hidden');
  }

  findNextBrick(currentBrick, direction) {
    const scale = Math.min(this.canvas.width, this.canvas.height) / 800;
    const brickWidth = 75 * scale;
    const brickHeight = 20 * scale;
    const padding = 5 * scale;
    
    // Calculate approximate next brick position
    const nextX = currentBrick.x + (direction.x * (brickWidth + padding));
    const nextY = currentBrick.y + (direction.y * (brickHeight + padding));
    
    // Find brick at that position
    return this.bricks.find(brick => 
      brick.visible &&
      Math.abs(brick.x - nextX) < (brickWidth / 2) &&
      Math.abs(brick.y - nextY) < (brickHeight / 2)
    );
  }

}

export default KnockoffArcade;