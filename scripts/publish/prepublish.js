import { execFileSync } from 'node:child_process';
import path from 'node:path';

const currentDir = import.meta.dirname;

console.log('prepublish script running for package: ' + process.env.npm_package_name);
const packageName = process.env.npm_package_name.split('/')[1];
// Validate the package name for ensuring that the package name does
// not contain any special characters that could be interpreted by the shell.
const isValidPackageName = /^[a-zA-Z0-9-_]+$/.test(packageName);
if (!isValidPackageName) {
    throw new Error(`Invalid package name: ${packageName}`);
}

// Run babel with custom plugins to fix non-index internal imports and add .js extensions.
const scriptPath = path.join(currentDir, 'replace-imports.sh');
const args = [path.join(currentDir, '..', '..', 'packages', packageName, 'lib'), 'cjs'];
execFileSync(scriptPath, args, {
    encoding: 'utf-8',
    cwd: currentDir,
});

if (!process.env.CI) {
    console.log('DO NOT TRY TO PUBLISH FROM YOUR LOCAL MACHINE! Publish only from CI.');
    process.exit(1);
}
