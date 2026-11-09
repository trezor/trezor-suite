import { execSync } from 'child_process';

export const getRevision = () => execSync('git rev-parse HEAD').toString().trim();
