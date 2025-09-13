module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleFileExtensions: ['js', 'json'],
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@core/(.*)$': '<rootDir>/src/js/core/$1',
    '^@components/(.*)$': '<rootDir>/src/js/components/$1',
    '^@systems/(.*)$': '<rootDir>/src/js/systems/$1',
    '^@utils/(.*)$': '<rootDir>/src/js/utils/$1',
    '^@config/(.*)$': '<rootDir>/src/js/config/$1'
  },
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js'
  ],
  collectCoverageFrom: [
    'src/js/**/*.js',
    '!src/js/index.js',
    '!src/js/**/*.config.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },
  testTimeout: 10000,
  verbose: true
};