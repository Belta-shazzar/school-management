/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',

  // Set env vars before any module is loaded (runs in the test VM)
  setupFiles: ['<rootDir>/tests/jest.setup.ts'],

  // Where Jest looks for tests
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.ts',
    '<rootDir>/tests/integration/**/*.test.ts',
  ],

  // TypeScript transform — uses tsconfig.test.json which extends the main
  // tsconfig but includes the tests/ directory and disables strict mode
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.test.json',
      },
    ],
  },

  // Module path aliases (none currently, but kept for extensibility)
  moduleNameMapper: {},

  // Coverage settings
  collectCoverageFrom: [
    'src/managers/entities/**/*.ts',
    'src/managers/token/**/*.ts',
    '!src/**/*.mongoModel.ts',
    '!src/**/*.schema.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // Give tests more time for MongoDB memory server
  testTimeout: 30000,
};
