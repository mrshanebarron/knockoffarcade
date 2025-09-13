import Vector2D from '../utils/Vector2D.js';
import GameConfig from '../config/GameConfig.js';

/**
 * Paddle entity class
 */
export class Paddle {
  constructor(x, y) {
    this.position = new Vector2D(x, y);
    this.velocity = new Vector2D(0, 0);
    this.width = GameConfig.PHYSICS.PADDLE_WIDTH;
    this.height = GameConfig.PHYSICS.PADDLE_HEIGHT;
    this.baseWidth = this.width;
    this.speed = GameConfig.PHYSICS.PADDLE_SPEED;
    this.powerUps = {};
    
    // AI assistance properties
    this.aiEnabled = false;
    this.aiStrength = 0.5;
    this.targetX = x;
    
    // Magnetic effect properties
    this.magneticRange = 0;
    this.magneticStrength = 0;
    
    // Visual effects
    this.glowEffects = [];
  }

  /**
   * Update paddle position and effects
   * @param {number} deltaTime - Time since last update
   * @param {Object} canvasBounds - Canvas boundaries
   * @param {Array} balls - Array of ball objects for AI assistance
   */
  update(deltaTime, canvasBounds, balls = []) {
    // Update power-ups
    this._updatePowerUps();
    
    // Update AI assistance
    if (this.aiEnabled && balls.length > 0) {
      this._updateAI(balls, deltaTime);
    }
    
    // Update position
    this.position.add(new Vector2D(this.velocity.x * deltaTime, this.velocity.y * deltaTime));
    
    // Constrain to canvas bounds
    this._constrainToBounds(canvasBounds);
    
    // Update visual effects
    this._updateVisualEffects();
  }

  /**
   * Move paddle left
   * @param {number} deltaTime - Time since last update
   */
  moveLeft(deltaTime) {
    if (!this.aiEnabled) {
      this.velocity.x = -this.speed;
    }
  }

  /**
   * Move paddle right
   * @param {number} deltaTime - Time since last update
   */
  moveRight(deltaTime) {
    if (!this.aiEnabled) {
      this.velocity.x = this.speed;
    }
  }

  /**
   * Stop paddle movement
   */
  stop() {
    if (!this.aiEnabled) {
      this.velocity.x = 0;
    }
  }

  /**
   * Set paddle position
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  setPosition(x, y) {
    this.position.set(x, y);
  }

  /**
   * Apply power-up effect
   * @param {string} type - Power-up type
   * @param {number} duration - Duration in milliseconds
   */
  applyPowerUp(type, duration = GameConfig.POWERUPS.DURATION) {
    this.powerUps[type] = Date.now() + duration;
    
    // Apply immediate effects
    switch (type) {
      case GameConfig.POWERUPS.TYPES.WIDE_PADDLE:
        this.width = this.baseWidth * 1.5;
        break;
      case GameConfig.POWERUPS.TYPES.MAGNETIC:
        this.magneticRange = 100;
        this.magneticStrength = 2;
        break;
      case GameConfig.POWERUPS.TYPES.LASER:
        // Laser effect handled in game logic
        break;
      case GameConfig.POWERUPS.TYPES.SHIELD:
        // Shield effect handled in rendering
        break;
    }
    
    // Add visual effect
    this.glowEffects.push({
      type,
      startTime: Date.now(),
      duration
    });
  }

  /**
   * Check if power-up is active
   * @param {string} type - Power-up type
   * @returns {boolean} True if active
   */
  hasPowerUp(type) {
    return this.powerUps[type] && this.powerUps[type] > Date.now();
  }

  /**
   * Remove power-up
   * @param {string} type - Power-up type
   */
  removePowerUp(type) {
    delete this.powerUps[type];
    
    // Remove effects
    switch (type) {
      case GameConfig.POWERUPS.TYPES.WIDE_PADDLE:
        this.width = this.baseWidth;
        break;
      case GameConfig.POWERUPS.TYPES.MAGNETIC:
        this.magneticRange = 0;
        this.magneticStrength = 0;
        break;
    }
  }

  /**
   * Enable AI assistance
   * @param {number} strength - AI strength (0-1)
   */
  enableAI(strength = 0.5) {
    this.aiEnabled = true;
    this.aiStrength = Math.max(0, Math.min(1, strength));
  }

  /**
   * Disable AI assistance
   */
  disableAI() {
    this.aiEnabled = false;
    this.velocity.x = 0;
  }

  /**
   * Get paddle bounds for collision detection
   * @returns {Object} Bounds object
   */
  getBounds() {
    return {
      left: this.position.x,
      right: this.position.x + this.width,
      top: this.position.y,
      bottom: this.position.y + this.height,
      centerX: this.position.x + this.width / 2,
      centerY: this.position.y + this.height / 2,
      width: this.width,
      height: this.height
    };
  }

  /**
   * Calculate ball hit position for angle adjustment
   * @param {number} ballX - Ball X position
   * @returns {number} Hit position (-1 to 1)
   */
  getHitPosition(ballX) {
    const bounds = this.getBounds();
    const relativeX = ballX - bounds.centerX;
    return Math.max(-1, Math.min(1, relativeX / (this.width / 2)));
  }

  /**
   * Apply magnetic force to balls
   * @param {Array} balls - Array of ball objects
   */
  applyMagneticForce(balls) {
    if (!this.hasPowerUp(GameConfig.POWERUPS.TYPES.MAGNETIC)) return;
    
    const bounds = this.getBounds();
    
    balls.forEach(ball => {
      const distance = ball.position.distanceTo(new Vector2D(bounds.centerX, bounds.centerY));
      
      if (distance < this.magneticRange) {
        const force = this.magneticStrength * (1 - distance / this.magneticRange);
        const direction = new Vector2D(bounds.centerX - ball.position.x, bounds.centerY - ball.position.y);
        direction.normalize().multiply(force);
        
        ball.addVelocity(direction.x, direction.y);
      }
    });
  }

  /**
   * Reset paddle to initial state
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  reset(x, y) {
    this.position.set(x, y);
    this.velocity.set(0, 0);
    this.width = this.baseWidth;
    this.powerUps = {};
    this.glowEffects = [];
    this.magneticRange = 0;
    this.magneticStrength = 0;
    this.aiEnabled = false;
  }

  /**
   * Update power-up states
   * @private
   */
  _updatePowerUps() {
    const now = Date.now();
    
    Object.keys(this.powerUps).forEach(type => {
      if (this.powerUps[type] <= now) {
        this.removePowerUp(type);
      }
    });
  }

  /**
   * Update AI assistance
   * @private
   */
  _updateAI(balls, deltaTime) {
    if (balls.length === 0) return;
    
    // Find the closest ball moving toward the paddle
    let targetBall = null;
    let minTime = Infinity;
    
    balls.forEach(ball => {
      if (ball.velocity.y > 0) { // Ball moving down
        const timeToReach = (this.position.y - ball.position.y) / ball.velocity.y;
        if (timeToReach > 0 && timeToReach < minTime) {
          minTime = timeToReach;
          targetBall = ball;
        }
      }
    });
    
    if (targetBall) {
      // Predict where the ball will be
      const predictedX = targetBall.position.x + targetBall.velocity.x * minTime;
      this.targetX = predictedX - this.width / 2;
    }
    
    // Move toward target with AI strength
    const bounds = this.getBounds();
    const diff = this.targetX - this.position.x;
    const moveSpeed = this.speed * this.aiStrength;
    
    if (Math.abs(diff) > 2) {
      this.velocity.x = Math.sign(diff) * moveSpeed;
    } else {
      this.velocity.x = 0;
    }
  }

  /**
   * Constrain paddle to canvas bounds
   * @private
   */
  _constrainToBounds(bounds) {
    if (this.position.x < 0) {
      this.position.x = 0;
      this.velocity.x = 0;
    } else if (this.position.x + this.width > bounds.width) {
      this.position.x = bounds.width - this.width;
      this.velocity.x = 0;
    }
  }

  /**
   * Update visual effects
   * @private
   */
  _updateVisualEffects() {
    const now = Date.now();
    
    // Remove expired glow effects
    this.glowEffects = this.glowEffects.filter(effect => {
      return (now - effect.startTime) < effect.duration;
    });
  }

  /**
   * Render the paddle
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  render(ctx) {
    ctx.save();
    
    // Create wooden paddle gradient
    const gradient = ctx.createLinearGradient(
      this.position.x, this.position.y,
      this.position.x, this.position.y + this.height
    );
    gradient.addColorStop(0, GameConfig.COLORS.SAND);
    gradient.addColorStop(0.3, '#d2b48c');
    gradient.addColorStop(0.7, '#8b7355');
    gradient.addColorStop(1, GameConfig.COLORS.BROWN_DARK);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
    
    // Add wood grain effect
    ctx.fillStyle = GameConfig.COLORS.BROWN_PRIMARY;
    ctx.fillRect(this.position.x + 2, this.position.y + 2, this.width - 4, 2);
    
    // Power-up effects
    this._renderPowerUpEffects(ctx);
    
    ctx.restore();
  }

  /**
   * Render power-up effects
   * @private
   */
  _renderPowerUpEffects(ctx) {
    // Laser effect
    if (this.hasPowerUp(GameConfig.POWERUPS.TYPES.LASER)) {
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 3;
      ctx.strokeRect(this.position.x - 2, this.position.y - 2, this.width + 4, this.height + 4);
    }
    
    // Wide paddle effect
    if (this.hasPowerUp(GameConfig.POWERUPS.TYPES.WIDE_PADDLE)) {
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.strokeRect(this.position.x - 1, this.position.y - 1, this.width + 2, this.height + 2);
    }
    
    // Shield effect
    if (this.hasPowerUp(GameConfig.POWERUPS.TYPES.SHIELD)) {
      ctx.strokeStyle = GameConfig.COLORS.BLUE;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(this.position.x - 4, this.position.y - 4, this.width + 8, this.height + 8);
      ctx.setLineDash([]);
    }
    
    // Magnetic effect
    if (this.hasPowerUp(GameConfig.POWERUPS.TYPES.MAGNETIC)) {
      ctx.strokeStyle = '#ff00ff';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(this.position.x - this.magneticRange, this.position.y - this.magneticRange, 
                    this.width + this.magneticRange * 2, this.height + this.magneticRange * 2);
      ctx.setLineDash([]);
    }
  }

  /**
   * Serialize paddle state
   * @returns {Object} Serialized state
   */
  serialize() {
    return {
      position: this.position.toObject(),
      velocity: this.velocity.toObject(),
      width: this.width,
      height: this.height,
      powerUps: this.powerUps,
      aiEnabled: this.aiEnabled,
      aiStrength: this.aiStrength
    };
  }

  /**
   * Deserialize paddle state
   * @param {Object} data - Serialized state
   */
  deserialize(data) {
    this.position.set(data.position.x, data.position.y);
    this.velocity.set(data.velocity.x, data.velocity.y);
    this.width = data.width;
    this.height = data.height;
    this.powerUps = data.powerUps || {};
    this.aiEnabled = data.aiEnabled || false;
    this.aiStrength = data.aiStrength || 0.5;
  }
}

export default Paddle;