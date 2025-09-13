<?php

namespace SuperBreakout\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use SuperBreakout\Models\LeaderboardModel;
use Monolog\Logger;

class LeaderboardController {
    private $model;
    private $logger;

    public function __construct($database, Logger $logger) {
        $this->model = new LeaderboardModel($database);
        $this->logger = $logger;
    }

    /**
     * Get leaderboard data
     */
    public function getLeaderboard(Request $request, Response $response, array $args): Response {
        try {
            $queryParams = $request->getQueryParams();
            $limit = isset($queryParams['limit']) ? (int)$queryParams['limit'] : 50;
            $limit = min(100, max(1, $limit)); // Clamp between 1-100

            $leaderboard = $this->model->getTopScores($limit);
            
            $this->logger->info('Leaderboard retrieved', ['limit' => $limit, 'count' => count($leaderboard)]);

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $leaderboard,
                'meta' => [
                    'limit' => $limit,
                    'count' => count($leaderboard)
                ]
            ]));

            return $response->withHeader('Content-Type', 'application/json');

        } catch (\Exception $e) {
            $this->logger->error('Error retrieving leaderboard', ['error' => $e->getMessage()]);
            
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Failed to retrieve leaderboard'
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    /**
     * Add new score to leaderboard
     */
    public function addScore(Request $request, Response $response, array $args): Response {
        try {
            $data = $request->getParsedBody();
            
            // Validate required fields
            if (!isset($data['playerName']) || !isset($data['score']) || !isset($data['level'])) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Missing required fields: playerName, score, level'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }

            // Sanitize and validate data
            $playerName = trim(substr($data['playerName'], 0, 50));
            $score = (int)$data['score'];
            $level = (int)$data['level'];
            $gameData = isset($data['gameData']) ? json_encode($data['gameData']) : null;

            if (empty($playerName)) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Player name cannot be empty'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }

            if ($score < 0 || $score > 10000000) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Invalid score value'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }

            // Check for potential spam/cheating
            $recentScores = $this->model->getRecentScores($playerName, 5);
            if (count($recentScores) >= 5) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'error' => 'Too many scores submitted recently'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(429);
            }

            $scoreId = $this->model->addScore($playerName, $score, $level, $gameData);
            $rank = $this->model->getPlayerRank($scoreId);
            $isNewRecord = $this->model->isPersonalBest($playerName, $score);

            $this->logger->info('Score added to leaderboard', [
                'player' => $playerName,
                'score' => $score,
                'level' => $level,
                'rank' => $rank,
                'isNewRecord' => $isNewRecord
            ]);

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => [
                    'scoreId' => $scoreId,
                    'rank' => $rank,
                    'isNewRecord' => $isNewRecord,
                    'playerName' => $playerName,
                    'score' => $score,
                    'level' => $level
                ]
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);

        } catch (\Exception $e) {
            $this->logger->error('Error adding score', ['error' => $e->getMessage()]);
            
            $response->getBody()->write(json_encode([
                'success' => false,
                'error' => 'Failed to add score'
            ]));

            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }
}