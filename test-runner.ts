#!/usr/bin/env tsx
/**
 * DONKEY KING TEST RUNNER
 *
 * Quick script to run various game tests and simulations
 */

import { runGameSimulation } from "./server/test-game-simulator";

console.log("🎴 DONKEY KING - TEST SUITE");
console.log("============================\n");

console.log("Available test commands:");
console.log("1. npm test              - Run all unit tests");
console.log("2. npm run test:rules    - Run game rules tests only");
console.log("3. npm run test:integration - Run integration tests");
console.log("4. npm run test:simulate - Run game simulation");
console.log("");

// Check command line argument
const command = process.argv[2];

switch (command) {
  case "simulate":
    console.log("🎮 Running game simulation...\n");
    runGameSimulation();
    break;

  case "help":
  default:
    console.log("Usage examples:");
    console.log("  npx tsx test-runner.ts simulate");
    console.log("  npm test");
    console.log("  npm run test:integration");
    break;
}
