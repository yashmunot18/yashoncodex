// Seed runner shim for Docker CMD
// This is executed as: node dist/seed-runner.js
import { execSync } from 'child_process';
try {
  execSync('npx prisma db seed', { stdio: 'inherit' });
} catch (e) {
  // Seed may have already run – that's fine
}
