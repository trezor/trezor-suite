import { execSync } from 'node:child_process';

execSync('rm -rf ./**/{libDev,lib,build,dist}', {
    encoding: 'utf8',
    stdio: 'inherit',
});

const t0a = performance.now();
execSync('yarn build:libs', {
    encoding: 'utf8',
    stdio: 'inherit',
});
const t1a = performance.now();

const t0b = performance.now();
execSync('yarn suite:build:web', {
    encoding: 'utf8',
    stdio: 'inherit',
});
const t1b = performance.now();

console.log(`Build libs duration: ${(t1a - t0a) / 1000}s`);
console.log(`Build web duration: ${(t1b - t0b) / 1000}s`);
console.log(`Total build duration: ${(t1b - t0a) / 1000}s`);
