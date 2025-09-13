/**
 * High Score Manager for KnockoffArcade
 * Handles high score storage, retrieval, and management
 */

export class HighScoreManager {
  constructor() {
    this.storageKey = 'knockoffarcade_highscores';
    this.maxScores = 10;
    this.highScores = this.loadHighScores();
  }

  /**
   * Load high scores from localStorage
   * @returns {Array} Array of high score entries
   */
  loadHighScores() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading high scores:', error);
    }
    
    // Return default high scores if none exist
    return [
      { name: 'Billy the Kid', score: 50000, level: 10, date: '2024-01-01' },
      { name: 'Jesse James', score: 40000, level: 9, date: '2024-01-01' },
      { name: 'Wyatt Earp', score: 30000, level: 8, date: '2024-01-01' },
      { name: 'Doc Holliday', score: 25000, level: 7, date: '2024-01-01' },
      { name: 'Wild Bill', score: 20000, level: 6, date: '2024-01-01' },
      { name: 'Calamity Jane', score: 15000, level: 5, date: '2024-01-01' },
      { name: 'Buffalo Bill', score: 10000, level: 4, date: '2024-01-01' },
      { name: 'Annie Oakley', score: 7500, level: 3, date: '2024-01-01' },
      { name: 'Butch Cassidy', score: 5000, level: 3, date: '2024-01-01' },
      { name: 'Sundance Kid', score: 2500, level: 2, date: '2024-01-01' }
    ];
  }

  /**
   * Save high scores to localStorage
   */
  saveHighScores() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.highScores));
    } catch (error) {
      console.error('Error saving high scores:', error);
    }
  }

  /**
   * Check if a score qualifies as a high score
   * @param {number} score - The score to check
   * @returns {boolean} True if it's a high score
   */
  isHighScore(score) {
    if (this.highScores.length < this.maxScores) {
      return true;
    }
    return score > this.highScores[this.highScores.length - 1].score;
  }

  /**
   * Get the rank for a given score
   * @param {number} score - The score to check
   * @returns {number} The rank (1-based), or -1 if not a high score
   */
  getRank(score) {
    for (let i = 0; i < this.highScores.length; i++) {
      if (score > this.highScores[i].score) {
        return i + 1;
      }
    }
    if (this.highScores.length < this.maxScores) {
      return this.highScores.length + 1;
    }
    return -1;
  }

  /**
   * Add a new high score
   * @param {string} name - Player name
   * @param {number} score - Player score
   * @param {number} level - Level reached
   * @returns {number} The rank achieved (1-based)
   */
  addHighScore(name, score, level) {
    const entry = {
      name: name.substring(0, 20), // Limit name length
      score: score,
      level: level,
      date: new Date().toISOString().split('T')[0]
    };

    // Find insertion position
    let position = this.highScores.length;
    for (let i = 0; i < this.highScores.length; i++) {
      if (score > this.highScores[i].score) {
        position = i;
        break;
      }
    }

    // Insert at position
    this.highScores.splice(position, 0, entry);

    // Keep only top scores
    if (this.highScores.length > this.maxScores) {
      this.highScores = this.highScores.slice(0, this.maxScores);
    }

    // Save to localStorage
    this.saveHighScores();

    return position + 1;
  }

  /**
   * Get all high scores
   * @returns {Array} Array of high score entries
   */
  getHighScores() {
    return [...this.highScores];
  }

  /**
   * Clear all high scores
   */
  clearHighScores() {
    this.highScores = [];
    this.saveHighScores();
  }

  /**
   * Format score for display
   * @param {number} score - The score to format
   * @returns {string} Formatted score string
   */
  formatScore(score) {
    return score.toLocaleString();
  }

  /**
   * Generate HTML for high scores display
   * @returns {string} HTML string for high scores table
   */
  generateHighScoresHTML() {
    if (this.highScores.length === 0) {
      return '<p style="text-align: center; color: #8b4513;">No high scores yet!</p>';
    }

    let html = '<table style="width: 100%; border-collapse: collapse;">';
    html += '<thead><tr style="border-bottom: 2px solid #8b4513;">';
    html += '<th style="text-align: left; padding: 8px; color: #8b4513;">Rank</th>';
    html += '<th style="text-align: left; padding: 8px; color: #8b4513;">Name</th>';
    html += '<th style="text-align: right; padding: 8px; color: #8b4513;">Score</th>';
    html += '<th style="text-align: center; padding: 8px; color: #8b4513;">Level</th>';
    html += '</tr></thead><tbody>';

    this.highScores.forEach((entry, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
      html += `<tr style="border-bottom: 1px solid #deb887;">`;
      html += `<td style="padding: 8px; color: #5d4037;">${medal} ${index + 1}</td>`;
      html += `<td style="padding: 8px; color: #5d4037; font-weight: bold;">${entry.name}</td>`;
      html += `<td style="padding: 8px; text-align: right; color: #8b4513; font-weight: bold;">${this.formatScore(entry.score)}</td>`;
      html += `<td style="padding: 8px; text-align: center; color: #5d4037;">${entry.level}</td>`;
      html += '</tr>';
    });

    html += '</tbody></table>';
    return html;
  }
}

export default HighScoreManager;