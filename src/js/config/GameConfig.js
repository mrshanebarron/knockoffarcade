/**
 * Game configuration and constants
 */
export const GameConfig = {
  // Canvas settings
  CANVAS: {
    DEFAULT_WIDTH: 800,
    DEFAULT_HEIGHT: 600,
    MIN_DIMENSION: 400
  },

  // Game mechanics
  GAME: {
    INITIAL_LIVES: 3,
    MAX_LEVEL: 10,
    BOSS_INTERVAL: 5, // Boss every 5 levels
    DIFFICULTY_SCALING: 1.1,
    COMBO_TIMEOUT: 2000, // ms
    ULTIMATE_CHARGE_MAX: 100
  },

  // Physics
  PHYSICS: {
    BALL_RADIUS: 8,
    BALL_SPEED: 3,
    PADDLE_WIDTH: 100,
    PADDLE_HEIGHT: 15,
    PADDLE_SPEED: 8,
    BRICK_WIDTH: 75,
    BRICK_HEIGHT: 20,
    BRICK_PADDING: 5,
    BRICK_ROWS: 8,
    BRICK_COLS: 10
  },

  // Power-up configurations
  POWERUPS: {
    DROP_CHANCE: 0.3, // 30% chance
    DURATION: 10000, // 10 seconds
    TYPES: {
      MULTI_BALL: 'multi_ball',
      WIDE_PADDLE: 'wide',
      LASER: 'laser',
      SHIELD: 'shield',
      SLOW_BALL: 'slow',
      FAST_BALL: 'fast',
      PIERCE: 'pierce',
      MAGNETIC: 'magnetic',
      EXPLOSIVE: 'explosive',
      TIME_FREEZE: 'time_freeze'
    }
  },

  // Scoring
  SCORING: {
    BRICK_BASE: 100,
    COMBO_MULTIPLIER: 1.5,
    LEVEL_BONUS_MULTIPLIER: 1000,
    POWERUP_BONUS: 250,
    BOSS_BONUS: 5000
  },

  // Visual effects
  EFFECTS: {
    PARTICLE_COUNT: 10,
    PARTICLE_LIFE: 1.0,
    PARTICLE_DECAY: 0.02,
    SCREEN_SHAKE_DURATION: 500,
    TRAIL_LENGTH: 5
  },

  // Colors (Western theme)
  COLORS: {
    BROWN_PRIMARY: '#8b4513',
    BROWN_SECONDARY: '#a0522d',
    BROWN_DARK: '#654321',
    SAND: '#deb887',
    GOLD: '#daa520',
    RED: '#dc143c',
    ORANGE: '#ff6600',
    GREEN: '#00ff7f',
    BLUE: '#00ffff'
  },

  // Audio settings
  AUDIO: {
    MASTER_VOLUME: 0.7,
    EFFECTS_VOLUME: 0.5,
    MUSIC_VOLUME: 0.3
  },

  // Achievement definitions
  ACHIEVEMENTS: {
    FIRST_BLOOD: { 
      id: 'first_blood', 
      name: 'First Draw', 
      description: 'Destroy your first target', 
      icon: '🔫' 
    },
    COMBO_MASTER: { 
      id: 'combo_master', 
      name: 'Gunslinger', 
      description: 'Achieve a 20+ combo streak', 
      icon: '🔥' 
    },
    LEVEL_10: { 
      id: 'level_10', 
      name: 'Frontier Marshal', 
      description: 'Reach level 10 in the Wild West', 
      icon: '🤠' 
    },
    BOSS_SLAYER: { 
      id: 'boss_slayer', 
      name: 'Outlaw Hunter', 
      description: 'Defeat your first gang boss', 
      icon: '👑' 
    },
    PERFECT_LEVEL: { 
      id: 'perfect_level', 
      name: 'Sharpshooter', 
      description: 'Complete a level without losing the ball', 
      icon: '🎯' 
    },
    POWER_USER: { 
      id: 'power_user', 
      name: 'Weapons Master', 
      description: 'Collect 10 power-ups in one game', 
      icon: '⚡' 
    },
    HIGH_ROLLER: { 
      id: 'high_roller', 
      name: 'High Stakes', 
      description: 'Score over 100,000 points', 
      icon: '💰' 
    },
    SPEED_DEMON: { 
      id: 'speed_demon', 
      name: 'Lightning Quick', 
      description: 'Complete a level in under 30 seconds', 
      icon: '⚡' 
    }
  },

  // Layout patterns for brick generation
  LAYOUTS: {
    CLASSIC: 'classic',
    PYRAMID: 'pyramid',
    DIAMOND: 'diamond',
    WAVE: 'wave',
    CHECKERED: 'checkered',
    CIRCLE: 'circle',
    CROSS: 'cross',
    HEART: 'heart',
    SPIRAL: 'spiral',
    RANDOM: 'random'
  }
};

// Environment-specific overrides
if (typeof window !== 'undefined') {
  // Browser-specific configurations
  GameConfig.TOUCH_ENABLED = 'ontouchstart' in window;
  GameConfig.MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export default GameConfig;