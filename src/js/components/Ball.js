import Vector2D from '../utils/Vector2D.js';
import GameConfig from '../config/GameConfig.js';

/**
 * Ball entity class
 */
export class Ball {
  constructor(x, y) {
    this.position = new Vector2D(x, y);
    this.velocity = new Vector2D(0, 0);
    this.radius = GameConfig.PHYSICS.BALL_RADIUS;
    this.powerUps = {};
    this.trails = [];
    this.maxTrails = GameConfig.EFFECTS.TRAIL_LENGTH;
    
    // Visual properties
    this.glowEffect = false;
    this.energyLevel = 1.0;
    this.lastTrailTime = 0;
    this.trailInterval = 16; // ~60fps trail updates
  }

  /**
   * Update ball position and physics
   * @param {number} deltaTime - Time since last update
   * @param {Object} canvasBounds - Canvas boundaries
   */
  update(deltaTime, canvasBounds) {
    // Update position
    this.position.add(
      new Vector2D(this.velocity.x * deltaTime, this.velocity.y * deltaTime)
    );

    // Handle boundary collisions
    this._handleBoundaryCollisions(canvasBounds);

    // Update power-ups
    this._updatePowerUps();

    // Update visual effects
    this._updateTrails();
    this._updateVisualEffects();
  }

  /**
   * Set ball velocity
   * @param {number} x - X velocity
   * @param {number} y - Y velocity
   */
  setVelocity(x, y) {
    this.velocity.set(x, y);
  }

  /**
   * Add velocity to current velocity
   * @param {number} x - X velocity to add
   * @param {number} y - Y velocity to add
   */
  addVelocity(x, y) {
    this.velocity.add(new Vector2D(x, y));
  }

  /**
   * Get current speed
   * @returns {number} Current speed
   */
  getSpeed() {
    return this.velocity.magnitude();
  }

  /**
   * Set speed while maintaining direction
   * @param {number} speed - New speed
   */
  setSpeed(speed) {
    const direction = this.velocity.normalized();
    this.velocity = direction.multiply(speed);
  }

  /**
   * Reverse ball direction
   * @param {string} axis - 'x' or 'y' to reverse specific axis, or 'both'
   */
  reverse(axis = 'both') {
    if (axis === 'x' || axis === 'both') {
      this.velocity.x = -this.velocity.x;
    }
    if (axis === 'y' || axis === 'both') {
      this.velocity.y = -this.velocity.y;
    }
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
      case GameConfig.POWERUPS.TYPES.FAST_BALL:
        this.setSpeed(this.getSpeed() * 1.5);
        break;
      case GameConfig.POWERUPS.TYPES.SLOW_BALL:
        this.setSpeed(this.getSpeed() * 0.5);
        break;
      case GameConfig.POWERUPS.TYPES.PIERCE:
        this.glowEffect = true;
        break;
    }
  }

  /**
   * Check if power-up is active
   * @param {string} type - Power-up type
   * @returns {boolean} True if active
   */
  hasPowerUp(type) {
    return !!(this.powerUps[type] && this.powerUps[type] > Date.now());
  }

  /**
   * Remove power-up
   * @param {string} type - Power-up type
   */
  removePowerUp(type) {
    delete this.powerUps[type];
    
    // Remove effects
    if (type === GameConfig.POWERUPS.TYPES.PIERCE) {
      this.glowEffect = false;
    }
  }

  /**
   * Reset ball to initial state
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  reset(x, y) {
    this.position.set(x, y);
    this.velocity.set(0, 0);
    this.powerUps = {};
    this.trails = [];
    this.glowEffect = false;
    this.energyLevel = 1.0;
  }

  /**
   * Get ball bounds for collision detection
   * @returns {Object} Bounds object
   */
  getBounds() {
    return {
      left: this.position.x - this.radius,
      right: this.position.x + this.radius,
      top: this.position.y - this.radius,
      bottom: this.position.y + this.radius,
      centerX: this.position.x,
      centerY: this.position.y,
      radius: this.radius
    };
  }

  /**
   * Handle collisions with canvas boundaries
   * @private
   */
  _handleBoundaryCollisions(bounds) {
    const ballBounds = this.getBounds();
    
    // Left and right walls
    if (ballBounds.left <= 0) {
      this.position.x = this.radius;
      this.velocity.x = Math.abs(this.velocity.x);
    } else if (ballBounds.right >= bounds.width) {
      this.position.x = bounds.width - this.radius;
      this.velocity.x = -Math.abs(this.velocity.x);
    }
    
    // Top wall
    if (ballBounds.top <= 0) {
      this.position.y = this.radius;
      this.velocity.y = Math.abs(this.velocity.y);
    }
    
    // Bottom is handled by game logic (ball lost)
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
   * Update trail effects
   * @private
   */
  _updateTrails() {
    const now = Date.now();
    
    // Add new trail point
    if (now - this.lastTrailTime > this.trailInterval) {
      this.trails.push({
        x: this.position.x,
        y: this.position.y,
        time: now,
        life: 1.0
      });
      
      this.lastTrailTime = now;
      
      // Remove old trails
      if (this.trails.length > this.maxTrails) {
        this.trails.shift();
      }
    }
    
    // Update trail life
    this.trails.forEach(trail => {
      const age = now - trail.time;
      trail.life = Math.max(0, 1 - (age / 500)); // 500ms trail fade
    });
    
    // Remove dead trails
    this.trails = this.trails.filter(trail => trail.life > 0);
  }

  /**
   * Update visual effects
   * @private
   */
  _updateVisualEffects() {
    // Update energy level based on speed
    const baseSpeed = GameConfig.PHYSICS.BALL_SPEED;
    const currentSpeed = this.getSpeed();
    this.energyLevel = Math.min(2.0, currentSpeed / baseSpeed);
  }

  /**
   * Render the ball
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  render(ctx) {
    ctx.save();
    
    // Render trails first
    this._renderTrails(ctx);
    
    // Create metallic gradient for cannonball effect
    const gradient = ctx.createRadialGradient(
      this.position.x - this.radius * 0.3,
      this.position.y - this.radius * 0.3,
      0,
      this.position.x,
      this.position.y,
      this.radius
    );
    
    gradient.addColorStop(0, '#c0c0c0'); // Silver highlight
    gradient.addColorStop(0.4, '#808080'); // Dark silver
    gradient.addColorStop(0.8, '#404040'); // Dark metal
    gradient.addColorStop(1, '#202020'); // Black outline
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Add metallic rim
    ctx.strokeStyle = '#2f1b14';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Pierce effect - glowing bullet
    if (this.hasPowerUp(GameConfig.POWERUPS.TYPES.PIERCE)) {
      ctx.strokeStyle = GameConfig.COLORS.GOLD;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.shadowBlur = 10;
      ctx.shadowColor = GameConfig.COLORS.GOLD;
    }
    
    ctx.restore();
  }

  /**
   * Render ball trails
   * @private
   */
  _renderTrails(ctx) {
    if (this.trails.length < 2) return;
    
    ctx.save();
    ctx.globalAlpha = 0.4;
    
    this.trails.forEach((trail, index) => {
      const alpha = trail.life * 0.4;
      const radius = this.radius * trail.life * 0.5;
      
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#808080';
      ctx.beginPath();
      ctx.arc(trail.x, trail.y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.restore();
  }

  /**
   * Create a copy of this ball
   * @returns {Ball} New ball instance
   */
  clone() {
    const newBall = new Ball(this.position.x, this.position.y);
    newBall.velocity = this.velocity.clone();
    newBall.radius = this.radius;
    newBall.powerUps = { ...this.powerUps };
    return newBall;
  }

  /**
   * Serialize ball state
   * @returns {Object} Serialized state
   */
  serialize() {
    return {
      position: this.position.toObject(),
      velocity: this.velocity.toObject(),
      radius: this.radius,
      powerUps: this.powerUps,
      energyLevel: this.energyLevel
    };
  }

  /**
   * Deserialize ball state
   * @param {Object} data - Serialized state
   */
  deserialize(data) {
    this.position.set(data.position.x, data.position.y);
    this.velocity.set(data.velocity.x, data.velocity.y);
    this.radius = data.radius;
    this.powerUps = data.powerUps || {};
    this.energyLevel = data.energyLevel || 1.0;
  }
}

export default Ball;