import { statSync } from 'node:fs';
import { resolve } from 'node:path';

const declarationPath = resolve(import.meta.dirname, '../libDev/src/services/yieldxyz.d.ts');
const declarationSize = statSync(declarationPath).size;
const maximumDeclarationSize = 1_000;

if (declarationSize > maximumDeclarationSize) {
    throw new Error(
        `yieldxyz.d.ts is ${declarationSize} bytes; expected at most ${maximumDeclarationSize}`,
    );
}

process.stdout.write(`yieldxyz.d.ts: ${declarationSize} bytes\n`);
