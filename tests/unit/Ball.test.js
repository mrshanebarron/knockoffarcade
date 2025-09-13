import Ball from '../../src/js/components/Ball.js';
import GameConfig from '../../src/js/config/GameConfig.js';

describe('Ball', () => {
  let ball;
  const canvasBounds = { width: 800, height: 600 };

  beforeEach(() => {
    ball = new Ball(100, 100);
  });

  test('should create ball with correct initial properties', () => {
    expect(ball.position.x).toBe(100);
    expect(ball.position.y).toBe(100);
    expect(ball.radius).toBe(GameConfig.PHYSICS.BALL_RADIUS);
    expect(ball.velocity.x).toBe(0);
    expect(ball.velocity.y).toBe(0);
  });

  test('should set velocity correctly', () => {
    ball.setVelocity(5, -3);
    expect(ball.velocity.x).toBe(5);
    expect(ball.velocity.y).toBe(-3);
  });

  test('should add velocity correctly', () => {
    ball.setVelocity(2, 3);
    ball.addVelocity(1, -1);
    expect(ball.velocity.x).toBe(3);
    expect(ball.velocity.y).toBe(2);
  });

  test('should calculate speed correctly', () => {
    ball.setVelocity(3, 4);
    expect(ball.getSpeed()).toBe(5);
  });

  test('should set speed while maintaining direction', () => {
    ball.setVelocity(3, 4);
    ball.setSpeed(10);
    expect(ball.getSpeed()).toBe(10);
    expect(ball.velocity.x).toBeCloseTo(6);
    expect(ball.velocity.y).toBeCloseTo(8);
  });

  test('should reverse direction correctly', () => {
    ball.setVelocity(3, 4);
    
    // Reverse X
    ball.reverse('x');
    expect(ball.velocity.x).toBe(-3);
    expect(ball.velocity.y).toBe(4);
    
    // Reverse Y
    ball.reverse('y');
    expect(ball.velocity.x).toBe(-3);
    expect(ball.velocity.y).toBe(-4);
    
    // Reverse both
    ball.reverse('both');
    expect(ball.velocity.x).toBe(3);
    expect(ball.velocity.y).toBe(4);
  });

  test('should update position based on velocity', () => {
    ball.setVelocity(2, 3);
    ball.update(1, canvasBounds);
    expect(ball.position.x).toBe(102);
    expect(ball.position.y).toBe(103);
  });

  test('should handle boundary collisions', () => {
    // Left wall
    ball.position.x = -5;
    ball.setVelocity(-2, 0);
    ball.update(1, canvasBounds);
    expect(ball.position.x).toBe(ball.radius);
    expect(ball.velocity.x).toBeGreaterThan(0);

    // Right wall
    ball.position.x = canvasBounds.width + 5;
    ball.setVelocity(2, 0);
    ball.update(1, canvasBounds);
    expect(ball.position.x).toBe(canvasBounds.width - ball.radius);
    expect(ball.velocity.x).toBeLessThan(0);

    // Top wall
    ball.position.y = -5;
    ball.setVelocity(0, -2);
    ball.update(1, canvasBounds);
    expect(ball.position.y).toBe(ball.radius);
    expect(ball.velocity.y).toBeGreaterThan(0);
  });

  test('should apply power-ups correctly', () => {
    const duration = 5000;
    ball.applyPowerUp(GameConfig.POWERUPS.TYPES.FAST_BALL, duration);
    
    expect(ball.hasPowerUp(GameConfig.POWERUPS.TYPES.FAST_BALL)).toBe(true);
    expect(ball.powerUps[GameConfig.POWERUPS.TYPES.FAST_BALL]).toBeGreaterThan(Date.now());
  });

  test('should remove expired power-ups', async () => {
    const shortDuration = 50;
    ball.applyPowerUp(GameConfig.POWERUPS.TYPES.PIERCE, shortDuration);
    
    expect(ball.hasPowerUp(GameConfig.POWERUPS.TYPES.PIERCE)).toBe(true);
    
    // Wait for power-up to expire
    await new Promise(resolve => setTimeout(resolve, 100));
    
    ball.update(1, canvasBounds);
    expect(ball.hasPowerUp(GameConfig.POWERUPS.TYPES.PIERCE)).toBe(false);
  });

  test('should get bounds correctly', () => {
    ball.position.x = 100;
    ball.position.y = 150;
    
    const bounds = ball.getBounds();
    expect(bounds.left).toBe(100 - ball.radius);
    expect(bounds.right).toBe(100 + ball.radius);
    expect(bounds.top).toBe(150 - ball.radius);
    expect(bounds.bottom).toBe(150 + ball.radius);
    expect(bounds.centerX).toBe(100);
    expect(bounds.centerY).toBe(150);
    expect(bounds.radius).toBe(ball.radius);
  });

  test('should reset correctly', () => {
    ball.setVelocity(5, 5);
    ball.applyPowerUp(GameConfig.POWERUPS.TYPES.PIERCE);
    ball.trails = [{ x: 1, y: 2 }];
    
    ball.reset(200, 300);
    
    expect(ball.position.x).toBe(200);
    expect(ball.position.y).toBe(300);
    expect(ball.velocity.x).toBe(0);
    expect(ball.velocity.y).toBe(0);
    expect(ball.powerUps).toEqual({});
    expect(ball.trails).toEqual([]);
    expect(ball.glowEffect).toBe(false);
  });

  test('should clone correctly', () => {
    ball.setVelocity(3, 4);
    ball.applyPowerUp(GameConfig.POWERUPS.TYPES.PIERCE);
    
    const clone = ball.clone();
    
    expect(clone.position.x).toBe(ball.position.x);
    expect(clone.position.y).toBe(ball.position.y);
    expect(clone.velocity.x).toBe(ball.velocity.x);
    expect(clone.velocity.y).toBe(ball.velocity.y);
    expect(clone.radius).toBe(ball.radius);
    expect(clone.powerUps).toEqual(ball.powerUps);
    expect(clone).not.toBe(ball);
  });

  test('should serialize and deserialize correctly', () => {
    ball.setVelocity(2, -3);
    ball.applyPowerUp(GameConfig.POWERUPS.TYPES.FAST_BALL);
    ball.energyLevel = 1.5;
    
    const serialized = ball.serialize();
    const newBall = new Ball(0, 0);
    newBall.deserialize(serialized);
    
    expect(newBall.position.x).toBe(ball.position.x);
    expect(newBall.position.y).toBe(ball.position.y);
    expect(newBall.velocity.x).toBe(ball.velocity.x);
    expect(newBall.velocity.y).toBe(ball.velocity.y);
    expect(newBall.radius).toBe(ball.radius);
    expect(newBall.energyLevel).toBe(ball.energyLevel);
  });

  test('should update trails correctly', () => {
    ball.setVelocity(5, 0);
    const initialTrailCount = ball.trails.length;
    
    // Fast forward time to create trails
    for (let i = 0; i < 10; i++) {
      ball.update(20, canvasBounds); // 20ms updates
    }
    
    expect(ball.trails.length).toBeGreaterThan(initialTrailCount);
    expect(ball.trails.length).toBeLessThanOrEqual(ball.maxTrails);
  });
});