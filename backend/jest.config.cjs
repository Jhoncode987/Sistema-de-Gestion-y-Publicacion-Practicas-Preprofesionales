// Configuración de Jest para el backend.
module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/src/**/*.test.cjs"],
  collectCoverageFrom: ["src/**/*.cjs", "!src/**/*.test.cjs"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "text-summary", "lcov", "json-summary"]
};
