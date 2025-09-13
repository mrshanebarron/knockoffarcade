<?php
require_once __DIR__ . '/../vendor/autoload.php';

use Slim\Factory\AppFactory;
use Slim\Middleware\CorsMiddleware;
use SuperBreakout\Controllers\LeaderboardController;
use SuperBreakout\Controllers\GameStateController;
use SuperBreakout\Controllers\AchievementController;
use SuperBreakout\Middleware\ValidationMiddleware;
use SuperBreakout\Middleware\AuthMiddleware;
use SuperBreakout\Config\Database;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// Create Slim app
$app = AppFactory::create();

// Add middleware
$app->add(new CorsMiddleware());
$app->addBodyParsingMiddleware();
$app->addRoutingMiddleware();

// Error handling
$errorMiddleware = $app->addErrorMiddleware(true, true, true);

// Set up logging
$logger = new Logger('superbreakout-api');
$logger->pushHandler(new StreamHandler(__DIR__ . '/logs/app.log', Logger::DEBUG));

// Initialize database
$database = new Database();

// Initialize controllers
$leaderboardController = new LeaderboardController($database, $logger);
$gameStateController = new GameStateController($database, $logger);
$achievementController = new AchievementController($database, $logger);

// Routes
$app->group('/api/v1', function ($group) use ($leaderboardController, $gameStateController, $achievementController) {
    
    // Leaderboard routes
    $group->get('/leaderboard', [$leaderboardController, 'getLeaderboard']);
    $group->post('/leaderboard', [$leaderboardController, 'addScore'])
          ->add(new ValidationMiddleware('score'));
    
    // Game state routes
    $group->get('/gamestate/{playerId}', [$gameStateController, 'getGameState']);
    $group->post('/gamestate', [$gameStateController, 'saveGameState'])
          ->add(new ValidationMiddleware('gamestate'));
    $group->delete('/gamestate/{playerId}', [$gameStateController, 'deleteGameState']);
    
    // Achievement routes
    $group->get('/achievements/{playerId}', [$achievementController, 'getAchievements']);
    $group->post('/achievements', [$achievementController, 'unlockAchievement'])
          ->add(new ValidationMiddleware('achievement'));
    
    // Health check
    $group->get('/health', function ($request, $response, $args) {
        $response->getBody()->write(json_encode([
            'status' => 'healthy',
            'timestamp' => date('c'),
            'version' => '2.0.0'
        ]));
        return $response->withHeader('Content-Type', 'application/json');
    });
});

// Run app
$app->run();