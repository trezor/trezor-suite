import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('prepublish script running for package: ' + process.env.npm_package_name);

//  test all d.ts files for existence of non-resolvable imports such as:
//  import("packages/protobuf/lib").MessageType
//  in the example "packages" segment is not resolvable. "packages" is a folder in the monorepo root and typescript
//  compiler does not replace it with absolute import starting with "@trezor".
//  there were issues with this in the past: https://github.com/trezor/trezor-suite/issues/10389
//  There are two ways to fix this:
//  1. rename "packages" folder in monorepo to "@trezor"
//  2. find and replace all the problematic occurrences before actual release.
//     not very good solution and yarn advices against doing it https://yarnpkg.com/advanced/lifecycle-scripts

execSync(
    `./replace-imports.sh ${path.join(
        __dirname,
        '..',
        'packages',
        process.env.npm_package_name.split('/')[1],
    )}/lib`,
    {
        encoding: 'utf-8',
        cwd: __dirname,
    },
);

if (!process.env.CI) {
    console.log('DO NOT TRY TO PUBLISH FROM YOUR LOCAL MACHINE! Publish only from CI.');
    process.exit(1);
}
