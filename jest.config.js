/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['dotenv-expand/config'],
  setupFilesAfterEnv: ['jest-extended/all'],
  testPathIgnorePatterns: ['__tests__/utils'],
};
