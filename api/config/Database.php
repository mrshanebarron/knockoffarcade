<?php

namespace SuperBreakout\Config;

use PDO;
use PDOException;

class Database {
    private $connection;
    private $host;
    private $database;
    private $username;
    private $password;
    
    public function __construct() {
        $this->host = $_ENV['DB_HOST'] ?? 'localhost';
        $this->database = $_ENV['DB_NAME'] ?? 'superbreakout';
        $this->username = $_ENV['DB_USER'] ?? 'root';
        $this->password = $_ENV['DB_PASS'] ?? '';
        
        $this->connect();
        $this->createTables();
    }
    
    private function connect(): void {
        try {
            $dsn = "mysql:host={$this->host};dbname={$this->database};charset=utf8mb4";
            
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
            ];
            
            $this->connection = new PDO($dsn, $this->username, $this->password, $options);
            
        } catch (PDOException $e) {
            // Fallback to SQLite for development
            try {
                $sqliteFile = __DIR__ . '/../../data/superbreakout.db';
                $this->connection = new PDO("sqlite:" . $sqliteFile, null, null, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                ]);
            } catch (PDOException $sqliteError) {
                throw new PDOException("Database connection failed: " . $e->getMessage());
            }
        }
    }
    
    private function createTables(): void {
        // Create leaderboard table
        $this->connection->exec("
            CREATE TABLE IF NOT EXISTS leaderboard (
                id INTEGER PRIMARY KEY AUTO_INCREMENT,
                player_name VARCHAR(50) NOT NULL,
                score INTEGER NOT NULL,
                level INTEGER NOT NULL,
                game_data TEXT,
                created_at DATETIME NOT NULL,
                INDEX idx_score (score DESC, created_at ASC),
                INDEX idx_player (player_name),
                INDEX idx_created (created_at)
            )
        ");
        
        // Create game_states table
        $this->connection->exec("
            CREATE TABLE IF NOT EXISTS game_states (
                id INTEGER PRIMARY KEY AUTO_INCREMENT,
                player_id VARCHAR(100) NOT NULL UNIQUE,
                game_data TEXT NOT NULL,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL,
                INDEX idx_player (player_id),
                INDEX idx_updated (updated_at)
            )
        ");
        
        // Create achievements table
        $this->connection->exec("
            CREATE TABLE IF NOT EXISTS achievements (
                id INTEGER PRIMARY KEY AUTO_INCREMENT,
                player_id VARCHAR(100) NOT NULL,
                achievement_id VARCHAR(50) NOT NULL,
                unlocked_at DATETIME NOT NULL,
                UNIQUE KEY unique_player_achievement (player_id, achievement_id),
                INDEX idx_player (player_id),
                INDEX idx_achievement (achievement_id)
            )
        ");
        
        // Create sessions table for security
        $this->connection->exec("
            CREATE TABLE IF NOT EXISTS sessions (
                id VARCHAR(128) PRIMARY KEY,
                player_id VARCHAR(100) NOT NULL,
                data TEXT,
                created_at DATETIME NOT NULL,
                expires_at DATETIME NOT NULL,
                INDEX idx_player (player_id),
                INDEX idx_expires (expires_at)
            )
        ");
    }
    
    public function getConnection(): PDO {
        return $this->connection;
    }
    
    public function beginTransaction(): bool {
        return $this->connection->beginTransaction();
    }
    
    public function commit(): bool {
        return $this->connection->commit();
    }
    
    public function rollback(): bool {
        return $this->connection->rollBack();
    }
    
    public function isHealthy(): bool {
        try {
            $this->connection->query("SELECT 1");
            return true;
        } catch (PDOException $e) {
            return false;
        }
    }
}