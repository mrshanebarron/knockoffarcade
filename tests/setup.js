// Jest setup file
import 'jest-canvas-mock';

// Mock HTMLCanvasElement methods that aren't implemented in jsdom
HTMLCanvasElement.prototype.getContext = jest.fn((contextType) => {
  if (contextType === '2d') {
    return {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      globalAlpha: 1,
      shadowBlur: 0,
      shadowColor: '',
      font: '10px sans-serif',
      textAlign: 'start',
      lineCap: 'butt',
      
      // Drawing methods
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
      clearRect: jest.fn(),
      beginPath: jest.fn(),
      closePath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      arc: jest.fn(),
      arcTo: jest.fn(),
      bezierCurveTo: jest.fn(),
      quadraticCurveTo: jest.fn(),
      rect: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      clip: jest.fn(),
      
      // Text methods
      fillText: jest.fn(),
      strokeText: jest.fn(),
      measureText: jest.fn(() => ({ width: 100 })),
      
      // Transform methods
      save: jest.fn(),
      restore: jest.fn(),
      scale: jest.fn(),
      rotate: jest.fn(),
      translate: jest.fn(),
      transform: jest.fn(),
      setTransform: jest.fn(),
      resetTransform: jest.fn(),
      
      // Gradient and pattern methods
      createLinearGradient: jest.fn(() => ({
        addColorStop: jest.fn()
      })),
      createRadialGradient: jest.fn(() => ({
        addColorStop: jest.fn()
      })),
      createPattern: jest.fn(),
      
      // Path methods
      isPointInPath: jest.fn(),
      isPointInStroke: jest.fn(),
      
      // Other methods
      setLineDash: jest.fn(),
      getLineDash: jest.fn(() => []),
      drawImage: jest.fn(),
      createImageData: jest.fn(),
      getImageData: jest.fn(),
      putImageData: jest.fn()
    };
  }
  return null;
});

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((callback) => {
  setTimeout(callback, 16); // ~60fps
});

global.cancelAnimationFrame = jest.fn();

// Mock performance.now()
global.performance = {
  now: jest.fn(() => Date.now())
};

// Mock window.localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Add global test utilities
global.testUtils = {
  createMockCanvas: () => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    return canvas;
  },
  
  createMockGameState: () => ({
    level: 1,
    score: 0,
    lives: 3,
    combo: 0,
    balls: [],
    paddle: null,
    bricks: [],
    powerUps: [],
    particles: []
  }),
  
  waitFor: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};