module.exports = {
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['js', 'json'],
  transform: {},
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: ['src/**/*.js'],
  coverageDirectory: 'coverage',
  // Mock browser extension APIs
  setupFiles: ['<rootDir>/jest.setup.js']
};