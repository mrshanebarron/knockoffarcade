/**
 * 2D Vector utility class for game physics calculations
 */
export class Vector2D {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  /**
   * Create a copy of this vector
   * @returns {Vector2D} New vector instance
   */
  clone() {
    return new Vector2D(this.x, this.y);
  }

  /**
   * Set vector components
   * @param {number} x - X component
   * @param {number} y - Y component
   * @returns {Vector2D} This vector for chaining
   */
  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  /**
   * Add another vector to this vector
   * @param {Vector2D} vector - Vector to add
   * @returns {Vector2D} This vector for chaining
   */
  add(vector) {
    this.x += vector.x;
    this.y += vector.y;
    return this;
  }

  /**
   * Subtract another vector from this vector
   * @param {Vector2D} vector - Vector to subtract
   * @returns {Vector2D} This vector for chaining
   */
  subtract(vector) {
    this.x -= vector.x;
    this.y -= vector.y;
    return this;
  }

  /**
   * Multiply this vector by a scalar
   * @param {number} scalar - Scalar value
   * @returns {Vector2D} This vector for chaining
   */
  multiply(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  /**
   * Divide this vector by a scalar
   * @param {number} scalar - Scalar value
   * @returns {Vector2D} This vector for chaining
   */
  divide(scalar) {
    if (scalar !== 0) {
      this.x /= scalar;
      this.y /= scalar;
    }
    return this;
  }

  /**
   * Get the magnitude (length) of this vector
   * @returns {number} Vector magnitude
   */
  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * Get the squared magnitude (for performance when comparing distances)
   * @returns {number} Squared magnitude
   */
  magnitudeSquared() {
    return this.x * this.x + this.y * this.y;
  }

  /**
   * Normalize this vector (make it unit length)
   * @returns {Vector2D} This vector for chaining
   */
  normalize() {
    const mag = this.magnitude();
    if (mag > 0) {
      this.divide(mag);
    }
    return this;
  }

  /**
   * Get a normalized copy of this vector
   * @returns {Vector2D} New normalized vector
   */
  normalized() {
    return this.clone().normalize();
  }

  /**
   * Calculate dot product with another vector
   * @param {Vector2D} vector - Other vector
   * @returns {number} Dot product
   */
  dot(vector) {
    return this.x * vector.x + this.y * vector.y;
  }

  /**
   * Calculate cross product with another vector (2D cross product returns scalar)
   * @param {Vector2D} vector - Other vector
   * @returns {number} Cross product
   */
  cross(vector) {
    return this.x * vector.y - this.y * vector.x;
  }

  /**
   * Calculate distance to another vector
   * @param {Vector2D} vector - Other vector
   * @returns {number} Distance
   */
  distanceTo(vector) {
    const dx = this.x - vector.x;
    const dy = this.y - vector.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate squared distance to another vector
   * @param {Vector2D} vector - Other vector
   * @returns {number} Squared distance
   */
  distanceToSquared(vector) {
    const dx = this.x - vector.x;
    const dy = this.y - vector.y;
    return dx * dx + dy * dy;
  }

  /**
   * Get the angle of this vector in radians
   * @returns {number} Angle in radians
   */
  angle() {
    return Math.atan2(this.y, this.x);
  }

  /**
   * Get the angle between this vector and another vector
   * @param {Vector2D} vector - Other vector
   * @returns {number} Angle in radians
   */
  angleTo(vector) {
    return Math.atan2(vector.y, vector.x) - Math.atan2(this.y, this.x);
  }

  /**
   * Rotate this vector by an angle
   * @param {number} angle - Angle in radians
   * @returns {Vector2D} This vector for chaining
   */
  rotate(angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = this.x * cos - this.y * sin;
    const y = this.x * sin + this.y * cos;
    this.x = x;
    this.y = y;
    return this;
  }

  /**
   * Reflect this vector across a normal vector
   * @param {Vector2D} normal - Normal vector to reflect across
   * @returns {Vector2D} This vector for chaining
   */
  reflect(normal) {
    const dot = this.dot(normal);
    this.x -= 2 * dot * normal.x;
    this.y -= 2 * dot * normal.y;
    return this;
  }

  /**
   * Clamp vector components between min and max values
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {Vector2D} This vector for chaining
   */
  clamp(min, max) {
    this.x = Math.max(min, Math.min(max, this.x));
    this.y = Math.max(min, Math.min(max, this.y));
    return this;
  }

  /**
   * Limit the magnitude of this vector
   * @param {number} max - Maximum magnitude
   * @returns {Vector2D} This vector for chaining
   */
  limit(max) {
    const mag = this.magnitude();
    if (mag > max) {
      this.multiply(max / mag);
    }
    return this;
  }

  /**
   * Linear interpolation between this vector and another
   * @param {Vector2D} vector - Target vector
   * @param {number} t - Interpolation factor (0-1)
   * @returns {Vector2D} This vector for chaining
   */
  lerp(vector, t) {
    this.x += (vector.x - this.x) * t;
    this.y += (vector.y - this.y) * t;
    return this;
  }

  /**
   * Check if this vector equals another vector
   * @param {Vector2D} vector - Other vector
   * @param {number} tolerance - Tolerance for floating point comparison
   * @returns {boolean} True if vectors are equal
   */
  equals(vector, tolerance = 0.0001) {
    return Math.abs(this.x - vector.x) < tolerance && 
           Math.abs(this.y - vector.y) < tolerance;
  }

  /**
   * Convert vector to string representation
   * @returns {string} String representation
   */
  toString() {
    return `Vector2D(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
  }

  /**
   * Convert vector to array
   * @returns {number[]} Array [x, y]
   */
  toArray() {
    return [this.x, this.y];
  }

  /**
   * Convert vector to object
   * @returns {Object} Object {x, y}
   */
  toObject() {
    return { x: this.x, y: this.y };
  }

  // Static methods
  
  /**
   * Create vector from angle and magnitude
   * @param {number} angle - Angle in radians
   * @param {number} magnitude - Vector magnitude
   * @returns {Vector2D} New vector
   */
  static fromAngle(angle, magnitude = 1) {
    return new Vector2D(
      Math.cos(angle) * magnitude,
      Math.sin(angle) * magnitude
    );
  }

  /**
   * Create random unit vector
   * @returns {Vector2D} Random unit vector
   */
  static random() {
    const angle = Math.random() * Math.PI * 2;
    return Vector2D.fromAngle(angle);
  }

  /**
   * Create zero vector
   * @returns {Vector2D} Zero vector
   */
  static zero() {
    return new Vector2D(0, 0);
  }

  /**
   * Create unit vector pointing right
   * @returns {Vector2D} Right unit vector
   */
  static right() {
    return new Vector2D(1, 0);
  }

  /**
   * Create unit vector pointing up
   * @returns {Vector2D} Up unit vector
   */
  static up() {
    return new Vector2D(0, -1);
  }
}

export default Vector2D;