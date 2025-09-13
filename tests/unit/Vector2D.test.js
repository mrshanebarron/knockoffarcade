import Vector2D from '../../src/js/utils/Vector2D.js';

describe('Vector2D', () => {
  let vector;

  beforeEach(() => {
    vector = new Vector2D(3, 4);
  });

  test('should create vector with correct coordinates', () => {
    expect(vector.x).toBe(3);
    expect(vector.y).toBe(4);
  });

  test('should calculate magnitude correctly', () => {
    expect(vector.magnitude()).toBe(5);
  });

  test('should calculate magnitude squared correctly', () => {
    expect(vector.magnitudeSquared()).toBe(25);
  });

  test('should normalize vector correctly', () => {
    vector.normalize();
    expect(vector.x).toBeCloseTo(0.6);
    expect(vector.y).toBeCloseTo(0.8);
    expect(vector.magnitude()).toBeCloseTo(1);
  });

  test('should add vectors correctly', () => {
    const other = new Vector2D(1, 2);
    vector.add(other);
    expect(vector.x).toBe(4);
    expect(vector.y).toBe(6);
  });

  test('should subtract vectors correctly', () => {
    const other = new Vector2D(1, 2);
    vector.subtract(other);
    expect(vector.x).toBe(2);
    expect(vector.y).toBe(2);
  });

  test('should multiply by scalar correctly', () => {
    vector.multiply(2);
    expect(vector.x).toBe(6);
    expect(vector.y).toBe(8);
  });

  test('should divide by scalar correctly', () => {
    vector.divide(2);
    expect(vector.x).toBe(1.5);
    expect(vector.y).toBe(2);
  });

  test('should calculate dot product correctly', () => {
    const other = new Vector2D(2, 3);
    expect(vector.dot(other)).toBe(18); // 3*2 + 4*3 = 18
  });

  test('should calculate cross product correctly', () => {
    const other = new Vector2D(2, 3);
    expect(vector.cross(other)).toBe(1); // 3*3 - 4*2 = 1
  });

  test('should calculate distance correctly', () => {
    const other = new Vector2D(0, 0);
    expect(vector.distanceTo(other)).toBe(5);
  });

  test('should calculate angle correctly', () => {
    const rightVector = new Vector2D(1, 0);
    expect(rightVector.angle()).toBe(0);
    
    const upVector = new Vector2D(0, 1);
    expect(upVector.angle()).toBeCloseTo(Math.PI / 2);
  });

  test('should rotate vector correctly', () => {
    const rightVector = new Vector2D(1, 0);
    rightVector.rotate(Math.PI / 2);
    expect(rightVector.x).toBeCloseTo(0);
    expect(rightVector.y).toBeCloseTo(1);
  });

  test('should reflect vector correctly', () => {
    const vector = new Vector2D(1, 1);
    const normal = new Vector2D(0, 1); // Vertical wall
    vector.reflect(normal);
    expect(vector.x).toBeCloseTo(1);
    expect(vector.y).toBeCloseTo(-1);
  });

  test('should clamp vector components', () => {
    const vector = new Vector2D(10, -5);
    vector.clamp(-2, 2);
    expect(vector.x).toBe(2);
    expect(vector.y).toBe(-2);
  });

  test('should limit vector magnitude', () => {
    vector.limit(3);
    expect(vector.magnitude()).toBeCloseTo(3);
  });

  test('should interpolate between vectors', () => {
    const target = new Vector2D(5, 6);
    vector.lerp(target, 0.5);
    expect(vector.x).toBe(4);
    expect(vector.y).toBe(5);
  });

  test('should check equality with tolerance', () => {
    const other = new Vector2D(3.0001, 4.0001);
    expect(vector.equals(other, 0.001)).toBe(true);
    expect(vector.equals(other, 0.00001)).toBe(false);
  });

  test('should clone vector correctly', () => {
    const clone = vector.clone();
    expect(clone.x).toBe(vector.x);
    expect(clone.y).toBe(vector.y);
    expect(clone).not.toBe(vector);
  });

  test('should create vector from angle', () => {
    const vector = Vector2D.fromAngle(0, 5);
    expect(vector.x).toBeCloseTo(5);
    expect(vector.y).toBeCloseTo(0);
    
    const vector2 = Vector2D.fromAngle(Math.PI / 2, 3);
    expect(vector2.x).toBeCloseTo(0);
    expect(vector2.y).toBeCloseTo(3);
  });

  test('should create random unit vector', () => {
    const randomVector = Vector2D.random();
    expect(randomVector.magnitude()).toBeCloseTo(1);
  });

  test('should convert to array', () => {
    const array = vector.toArray();
    expect(array).toEqual([3, 4]);
  });

  test('should convert to object', () => {
    const obj = vector.toObject();
    expect(obj).toEqual({ x: 3, y: 4 });
  });
});