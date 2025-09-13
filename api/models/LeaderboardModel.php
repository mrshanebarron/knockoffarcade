<?php

namespace SuperBreakout\Models;

class LeaderboardModel {
    private $db;

    public function __construct($database) {
        $this->db = $database->getConnection();
    }

    /**
     * Get top scores from leaderboard
     */
    public function getTopScores($limit = 50): array {
        $stmt = $this->db->prepare("
            SELECT 
                id,
                player_name,
                score,
                level,
                created_at,
                ROW_NUMBER() OVER (ORDER BY score DESC, created_at ASC) as rank
            FROM leaderboard 
            ORDER BY score DESC, created_at ASC 
            LIMIT :limit
        ");
        
        $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    /**
     * Add new score to leaderboard
     */
    public function addScore(string $playerName, int $score, int $level, ?string $gameData = null): int {
        $stmt = $this->db->prepare("
            INSERT INTO leaderboard (player_name, score, level, game_data, created_at) 
            VALUES (:player_name, :score, :level, :game_data, NOW())
        ");
        
        $stmt->bindValue(':player_name', $playerName);
        $stmt->bindValue(':score', $score, \PDO::PARAM_INT);
        $stmt->bindValue(':level', $level, \PDO::PARAM_INT);
        $stmt->bindValue(':game_data', $gameData);
        
        $stmt->execute();
        
        return (int)$this->db->lastInsertId();
    }

    /**
     * Get player's rank for a specific score
     */
    public function getPlayerRank(int $scoreId): int {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) + 1 as rank
            FROM leaderboard l1
            JOIN leaderboard l2 ON l2.id = :score_id
            WHERE l1.score > l2.score 
            OR (l1.score = l2.score AND l1.created_at < l2.created_at)
        ");
        
        $stmt->bindValue(':score_id', $scoreId, \PDO::PARAM_INT);
        $stmt->execute();
        
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);
        return (int)$result['rank'];
    }

    /**
     * Check if score is a personal best for player
     */
    public function isPersonalBest(string $playerName, int $score): bool {
        $stmt = $this->db->prepare("
            SELECT MAX(score) as best_score
            FROM leaderboard 
            WHERE player_name = :player_name
        ");
        
        $stmt->bindValue(':player_name', $playerName);
        $stmt->execute();
        
        $result = $stmt->fetch(\PDO::FETCH_ASSOC);
        $bestScore = $result['best_score'] ?? 0;
        
        return $score > $bestScore;
    }

    /**
     * Get recent scores for a player (anti-spam)
     */
    public function getRecentScores(string $playerName, int $minutes = 5): array {
        $stmt = $this->db->prepare("
            SELECT id, score, created_at
            FROM leaderboard 
            WHERE player_name = :player_name 
            AND created_at > DATE_SUB(NOW(), INTERVAL :minutes MINUTE)
            ORDER BY created_at DESC
        ");
        
        $stmt->bindValue(':player_name', $playerName);
        $stmt->bindValue(':minutes', $minutes, \PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    /**
     * Get leaderboard statistics
     */
    public function getStatistics(): array {
        $stmt = $this->db->query("
            SELECT 
                COUNT(*) as total_scores,
                MAX(score) as highest_score,
                AVG(score) as average_score,
                COUNT(DISTINCT player_name) as unique_players,
                MAX(level) as highest_level
            FROM leaderboard
        ");
        
        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }

    /**
     * Clean old scores (keep top 1000)
     */
    public function cleanOldScores(): int {
        $stmt = $this->db->prepare("
            DELETE FROM leaderboard 
            WHERE id NOT IN (
                SELECT id FROM (
                    SELECT id 
                    FROM leaderboard 
                    ORDER BY score DESC, created_at ASC 
                    LIMIT 1000
                ) as top_scores
            )
        ");
        
        $stmt->execute();
        return $stmt->rowCount();
    }
}