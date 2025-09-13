/**
 * Complete SuperBreakout Game - Working Version
 */

import { HighScoreManager } from './systems/HighScoreManager.js';

export class SuperBreakout {
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
    this.keys = {};

    // Initialize high score manager
    this.highScoreManager = new HighScoreManager();
    this.displayHighScores();

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
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    window.addEventListener('resize', () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.initializeGame();
    });
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

  getBrickColor(row) {
    const colors = ['#dc143c', '#ff6600', '#ffd700', '#00ff7f', '#00ffff', '#8a2be2', '#ff69b4', '#deb887'];
    return colors[row % colors.length];
  }

  setupEventListeners() {
    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      
      if (e.code === 'Space') {
        e.preventDefault();
        if (this.gameState === 'start') {
          this.startGame();
        } else if (this.gameState === 'gameOver') {
          this.resetGame();
        } else if (this.gameState === 'highScores') {
          this.hideHighScores();
        }
      } else if (e.code === 'KeyH') {
        e.preventDefault();
        if (this.gameState === 'gameOver' || this.gameState === 'start') {
          this.showHighScores();
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
  }

  startGame() {
    this.gameState = 'playing';
    this.startScreen.classList.add('hidden');
    this.gameOverScreen.classList.add('hidden');
    document.body.classList.add('playing');
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
        this.createParticles(ball.x, ball.y, '#ff0000', 10);
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
    
    // Check if ball has spike power-up
    const hasSpike = ball.powerUps.spike;
    
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
      this.score += 100 * this.multiplier;
      this.combo++;
      
      // Create particles
      this.createParticles(hitBrick.x + hitBrick.width / 2, hitBrick.y + hitBrick.height / 2, hitBrick.color, hasSpike ? 15 : 10);
      
      // Random power-up drop (only from first brick)
      if (hitBrick === brick && Math.random() < 0.3) {
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
    
    this.createBricks();
    this.resetBall();
  }

  resetBall() {
    const scale = Math.min(this.canvas.width, this.canvas.height) / 800;
    this.ball.x = this.canvas.width / 2;
    this.ball.y = this.canvas.height / 2;
    this.ball.speedX = (Math.random() > 0.5 ? 1 : -1) * 2 * scale;
    this.ball.speedY = -2 * scale;
    this.balls = [this.ball];
  }

  async gameOver() {
    this.gameState = 'gameOver';
    document.body.classList.remove('playing');
    
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
    const types = ['multi', 'wide', 'fast', 'slow', 'spike'];
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff6600'];
    const typeIndex = Math.floor(Math.random() * types.length);
    
    this.powerUps.push({
      x: x - 10,
      y: y,
      width: 20,
      height: 20,
      type: types[typeIndex],
      color: colors[typeIndex]
    });
  }

  applyPowerUp(type) {
    switch (type) {
      case 'multi':
        if (this.balls.length < 5) {
          const newBall = { ...this.ball };
          newBall.speedX = -newBall.speedX;
          // Inherit power-ups from the original ball
          newBall.powerUps = { ...this.ball.powerUps };
          this.balls.push(newBall);
        }
        break;
      case 'wide':
        this.paddle.width *= 1.5;
        break;
      case 'fast':
        this.balls.forEach(ball => {
          ball.speedX *= 1.5;
          ball.speedY *= 1.5;
        });
        break;
      case 'spike':
        this.balls.forEach(ball => {
          ball.powerUps.spike = true; // Permanent spike power
        });
        break;
      case 'slow':
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

    // Draw bricks
    for (let brick of this.bricks) {
      if (brick.visible) {
        this.ctx.fillStyle = brick.color;
        this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        
        // Add border
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
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
      const hasSpike = ball.powerUps.spike;
      
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
        // Draw normal ball
        const ballGradient = this.ctx.createRadialGradient(
          ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, 0,
          ball.x, ball.y, ball.radius
        );
        ballGradient.addColorStop(0, '#c0c0c0');
        ballGradient.addColorStop(0.4, '#808080');
        ballGradient.addColorStop(1, '#404040');
        
        this.ctx.fillStyle = ballGradient;
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    // Draw power-ups
    for (let powerUp of this.powerUps) {
      const centerX = powerUp.x + powerUp.width / 2;
      const centerY = powerUp.y + powerUp.height / 2;
      const radius = powerUp.width / 2;
      
      this.ctx.save();
      
      switch (powerUp.type) {
        case 'spike':
          // Draw spike power-up with spiky edges
          this.ctx.fillStyle = powerUp.color;
          this.ctx.beginPath();
          const spikes = 6;
          
          for (let i = 0; i < spikes * 2; i++) {
            const angle = (i * Math.PI) / spikes;
            const r = i % 2 === 0 ? radius : radius * 0.6;
            const x = centerX + Math.cos(angle) * r;
            const y = centerY + Math.sin(angle) * r;
            
            if (i === 0) {
              this.ctx.moveTo(x, y);
            } else {
              this.ctx.lineTo(x, y);
            }
          }
          this.ctx.closePath();
          this.ctx.fill();
          
          // Add lightning symbol
          this.ctx.fillStyle = '#fff';
          this.ctx.font = '10px Arial';
          this.ctx.textAlign = 'center';
          this.ctx.fillText('⚡', centerX, centerY + 3);
          break;
          
        case 'multi':
          // Draw multi-ball power-up as overlapping circles
          this.ctx.fillStyle = powerUp.color;
          
          // Main circle
          this.ctx.beginPath();
          this.ctx.arc(centerX, centerY, radius * 0.8, 0, Math.PI * 2);
          this.ctx.fill();
          
          // Smaller overlapping circles
          this.ctx.fillStyle = '#ff6666';
          this.ctx.beginPath();
          this.ctx.arc(centerX - 3, centerY - 3, radius * 0.5, 0, Math.PI * 2);
          this.ctx.fill();
          
          this.ctx.beginPath();
          this.ctx.arc(centerX + 3, centerY - 3, radius * 0.5, 0, Math.PI * 2);
          this.ctx.fill();
          
          this.ctx.beginPath();
          this.ctx.arc(centerX, centerY + 4, radius * 0.5, 0, Math.PI * 2);
          this.ctx.fill();
          break;
          
        case 'wide':
          // Draw wide paddle power-up as expanding bars
          this.ctx.fillStyle = powerUp.color;
          
          // Center bar
          this.ctx.fillRect(centerX - 8, centerY - 2, 16, 4);
          
          // Expanding bars
          this.ctx.fillStyle = '#66ff66';
          this.ctx.fillRect(centerX - 6, centerY - 4, 12, 2);
          this.ctx.fillRect(centerX - 4, centerY - 6, 8, 2);
          this.ctx.fillRect(centerX - 6, centerY + 2, 12, 2);
          this.ctx.fillRect(centerX - 4, centerY + 4, 8, 2);
          
          // Arrow symbols
          this.ctx.fillStyle = '#fff';
          this.ctx.font = '8px Arial';
          this.ctx.textAlign = 'center';
          this.ctx.fillText('←→', centerX, centerY + 2);
          break;
          
        case 'fast':
          // Draw speed power-up with motion lines
          this.ctx.fillStyle = powerUp.color;
          
          // Main diamond shape
          this.ctx.beginPath();
          this.ctx.moveTo(centerX, centerY - radius);
          this.ctx.lineTo(centerX + radius, centerY);
          this.ctx.lineTo(centerX, centerY + radius);
          this.ctx.lineTo(centerX - radius, centerY);
          this.ctx.closePath();
          this.ctx.fill();
          
          // Motion lines
          this.ctx.strokeStyle = '#ffff66';
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          for (let i = 0; i < 3; i++) {
            const offset = -radius - 3 - (i * 2);
            this.ctx.moveTo(centerX + offset, centerY - 3);
            this.ctx.lineTo(centerX + offset + 4, centerY - 3);
            this.ctx.moveTo(centerX + offset, centerY + 3);
            this.ctx.lineTo(centerX + offset + 4, centerY + 3);
          }
          this.ctx.stroke();
          
          // Speed symbol
          this.ctx.fillStyle = '#fff';
          this.ctx.font = '8px Arial';
          this.ctx.textAlign = 'center';
          this.ctx.fillText('⚡', centerX, centerY + 2);
          break;
          
        case 'slow':
          // Draw slow power-up with clock-like design
          this.ctx.fillStyle = powerUp.color;
          
          // Main circle
          this.ctx.beginPath();
          this.ctx.arc(centerX, centerY, radius * 0.9, 0, Math.PI * 2);
          this.ctx.fill();
          
          // Clock marks
          this.ctx.strokeStyle = '#fff';
          this.ctx.lineWidth = 1;
          for (let i = 0; i < 12; i++) {
            const angle = (i * Math.PI * 2) / 12;
            const startX = centerX + Math.cos(angle) * radius * 0.7;
            const startY = centerY + Math.sin(angle) * radius * 0.7;
            const endX = centerX + Math.cos(angle) * radius * 0.5;
            const endY = centerY + Math.sin(angle) * radius * 0.5;
            
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
          }
          
          // Clock hands
          this.ctx.strokeStyle = '#fff';
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.moveTo(centerX, centerY);
          this.ctx.lineTo(centerX, centerY - radius * 0.4);
          this.ctx.moveTo(centerX, centerY);
          this.ctx.lineTo(centerX + radius * 0.3, centerY);
          this.ctx.stroke();
          break;
          
        default:
          // Fallback for any other power-ups
          this.ctx.fillStyle = powerUp.color;
          this.ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
          break;
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

export default SuperBreakout;