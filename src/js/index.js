/**
 * SuperBreakout Game - Enterprise Edition
 * Main entry point
 */

import '../css/main.css';
import { logger } from './core/Logger.js';
import GameConfig from './config/GameConfig.js';

// Initialize application
class App {
  constructor() {
    this.game = null;
    this.isInitialized = false;
    
    logger.info('SuperBreakout Enterprise Edition starting...');
    logger.info('Environment:', {
      userAgent: navigator.userAgent,
      mobile: GameConfig.MOBILE,
      touchEnabled: GameConfig.TOUCH_ENABLED
    });
  }

  async init() {
    try {
      // Check for required browser features
      if (!this.checkBrowserSupport()) {
        throw new Error('Browser not supported');
      }

      // Initialize game systems
      await this.initializeGame();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Register service worker for PWA
      await this.registerServiceWorker();
      
      // Set up PWA install prompt
      this.setupInstallPrompt();
      
      this.isInitialized = true;
      logger.info('Application initialized successfully');
      
      // Start the game
      this.startGame();
      
    } catch (error) {
      logger.fatal('Failed to initialize application', error);
      this.showErrorScreen(error.message);
    }
  }

  checkBrowserSupport() {
    const required = [
      'requestAnimationFrame',
      'localStorage',
      'JSON',
      'Promise'
    ];

    for (const feature of required) {
      if (!(feature in window)) {
        logger.error('Missing required browser feature:', feature);
        return false;
      }
    }

    // Check for Canvas support
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      logger.error('Canvas 2D context not supported');
      return false;
    }

    return true;
  }

  async initializeGame() {
    // Dynamically import the game module to enable code splitting
    const { SuperBreakout } = await import('./Game.js');
    
    this.game = new SuperBreakout();
    await this.game.init();
  }

  setupEventListeners() {
    // Global error handler
    window.addEventListener('error', (event) => {
      logger.error('Global error:', event.error);
    });

    // Unhandled promise rejection
    window.addEventListener('unhandledrejection', (event) => {
      logger.error('Unhandled promise rejection:', event.reason);
    });

    // Visibility change (pause game when tab is hidden)
    document.addEventListener('visibilitychange', () => {
      if (this.game) {
        if (document.hidden) {
          this.game.pause();
        } else {
          this.game.resume();
        }
      }
    });

    // Window resize
    window.addEventListener('resize', () => {
      if (this.game) {
        this.game.handleResize();
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (event) => {
      // F11 for fullscreen
      if (event.key === 'F11') {
        event.preventDefault();
        this.toggleFullscreen();
      }
      
      // Escape to pause
      if (event.key === 'Escape' && this.game) {
        this.game.togglePause();
      }
    });
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        logger.info('Service Worker registered:', registration.scope);
      } catch (error) {
        logger.warn('Service Worker registration failed:', error);
      }
    }
  }

  setupInstallPrompt() {
    let deferredPrompt;
    const installBtn = document.getElementById('installBtn');

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      deferredPrompt = event;
      
      if (installBtn) {
        installBtn.style.display = 'block';
      }
    });

    // Global install function for the button
    window.installApp = async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        logger.info('PWA install prompt outcome:', outcome);
        
        if (installBtn) {
          installBtn.style.display = 'none';
        }
        deferredPrompt = null;
      }
    };
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        logger.warn('Failed to enter fullscreen:', err);
      });
    } else {
      document.exitFullscreen().catch(err => {
        logger.warn('Failed to exit fullscreen:', err);
      });
    }
  }

  startGame() {
    if (this.game && this.isInitialized) {
      this.game.start();
    }
  }

  showErrorScreen(message) {
    const container = document.querySelector('.game-container');
    if (container) {
      container.innerHTML = `
        <div class="start-screen">
          <h1 style="color: var(--color-red);">⚠️ ERROR ⚠️</h1>
          <p>Failed to start the game:</p>
          <p style="color: var(--color-red); font-weight: bold;">${message}</p>
          <p>Please try refreshing the page or check your browser compatibility.</p>
          <button onclick="location.reload()" style="
            background: var(--color-brown-primary);
            color: var(--color-sand);
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-family: var(--font-primary);
            font-weight: bold;
          ">Refresh Page</button>
        </div>
      `;
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
  });
} else {
  const app = new App();
  app.init();
}

// Export for testing
export default App;