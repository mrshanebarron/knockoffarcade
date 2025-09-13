# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an enterprise-grade Wild West themed Breakout game built with modern web technologies. The project has been completely refactored from a single-file implementation into a modular, scalable application with proper separation of concerns.

## Commands

### Development Commands
```bash
# Install dependencies
npm install
composer install  # For PHP backend

# Development server (webpack-dev-server)
npm run dev        # Frontend on localhost:3000

# PHP backend server
npm run serve      # PHP built-in server on localhost:8080

# Build for production
npm run build

# Run tests
npm test                    # Unit tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage report

# Code quality
npm run lint              # ESLint
npm run lint:fix         # Auto-fix linting issues
npm run format          # Prettier formatting

# Bundle analysis
npm run analyze
```

### PHP Backend Commands
```bash
# Install PHP dependencies
composer install

# Run tests
composer test

# Code analysis
composer phpstan
composer phpcs
```

## Architecture

### Frontend Structure (`src/`)
```
src/
├── js/
│   ├── core/           # Core systems (EventEmitter, Logger)
│   ├── components/     # Game entities (Ball, Paddle, Brick)
│   ├── systems/        # Game systems (Physics, Rendering, Audio)
│   ├── utils/          # Utilities (Vector2D, helpers)
│   ├── config/         # Configuration (GameConfig)
│   ├── Game.js         # Main game class
│   └── index.js        # Application entry point
├── css/
│   ├── components/     # Component-specific styles
│   ├── themes/         # Theme files (western.css)
│   └── main.css        # Main stylesheet
└── assets/             # Static assets (images, sounds, fonts)
```

### Backend Structure (`api/`)
```
api/
├── Controllers/        # HTTP controllers
├── Models/            # Data models
├── Middleware/        # Custom middleware
├── Config/            # Configuration classes
└── index.php          # API entry point
```

## Key Components

### Core Systems
1. **EventEmitter** (`src/js/core/EventEmitter.js`): Decoupled communication between components
2. **Logger** (`src/js/core/Logger.js`): Enterprise logging with levels, performance timing, and export
3. **Vector2D** (`src/js/utils/Vector2D.js`): 2D vector math for physics calculations

### Game Components
1. **Ball** (`src/js/components/Ball.js`): Ball entity with physics, power-ups, and visual effects
2. **Paddle** (`src/js/components/Paddle.js`): Player paddle with AI assistance and power-ups
3. **KnockoffArcade** (`src/js/Game.js`): Main game orchestrator

### Configuration Management
- **GameConfig** (`src/js/config/GameConfig.js`): Centralized game configuration
- Environment-specific overrides for mobile/desktop
- CSS custom properties in `src/css/base.css`

### PHP Backend Features
- **Slim Framework 4**: RESTful API architecture
- **Database Abstraction**: MySQL with SQLite fallback
- **Leaderboard System**: High scores with anti-cheat measures
- **Game State Persistence**: Save/load game progress
- **Achievement Tracking**: Unlock and track player achievements
- **API Security**: Rate limiting, validation, logging

## Build System (Webpack 5)

### Features
- **Code Splitting**: Automatic bundle optimization
- **Hot Module Replacement**: Development server with HMR
- **Progressive Web App**: Service worker generation
- **CSS Processing**: PostCSS with optimization
- **Asset Optimization**: Image and font processing
- **Bundle Analysis**: Webpack Bundle Analyzer integration

### Environment Configs
- `webpack.common.js`: Shared configuration
- `webpack.dev.js`: Development with HMR and source maps
- `webpack.prod.js`: Production with minification and PWA features

## Testing

### Unit Tests
- **Jest**: Test framework with jsdom environment
- **Coverage**: 75% minimum threshold for branches, functions, lines, statements
- **Mock Canvas**: Canvas API mocking for headless testing
- **Test Files**: Located in `tests/unit/`

### Key Test Areas
- Vector2D mathematical operations
- Ball physics and collisions
- Game state management
- API endpoints (PHP)

## Database Schema

### Tables
1. **leaderboard**: High scores storage
2. **game_states**: Saved game progress
3. **achievements**: Player achievement tracking
4. **sessions**: Secure session management

## Environment Configuration

### Required Environment Variables (.env)
```bash
DB_HOST=localhost
DB_NAME=knockoffarcade
DB_USER=root
DB_PASS=

API_VERSION=2.0.0
JWT_SECRET=your-secret-key
SESSION_LIFETIME=3600
```

## Performance Optimizations

### Frontend
- Webpack code splitting and lazy loading
- Service worker caching
- Canvas rendering optimizations
- Object pooling for particles and effects
- requestAnimationFrame game loop

### Backend
- Database query optimization
- Connection pooling
- Rate limiting and caching
- Prepared statements for security

## Development Workflow

1. **Setup**: `npm install && composer install`
2. **Development**: `npm run dev` + `npm run serve` (two terminals)
3. **Testing**: `npm test` for continuous testing
4. **Building**: `npm run build` for production builds
5. **Deployment**: Built files in `public/` directory

## Browser Support

- Modern browsers supporting ES6+ modules
- Canvas 2D context required
- localStorage support needed
- Progressive Web App features where available

## Security Features

- SQL injection protection via prepared statements
- XSS protection through output encoding
- CSRF protection on state-changing operations
- Rate limiting on API endpoints
- Input validation and sanitization