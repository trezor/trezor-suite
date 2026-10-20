import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

import { getTrezorPackageDir, getTrezorPackageRelativePath } from './trezor-package-path';

const root = path.resolve(__dirname, '../..');
const scriptPath = path.join(__dirname, 'trezor-package-path.ts');

describe('trezor-package-path', () => {
    it.each([
        ['connect', 'packages/connect'],
        ['network-tron', 'networks/tron/network-tron'],
        [
            'network-module-suite-common-types',
            'networks/network-module/suite-common/suite-common-types',
        ],
    ])('resolves %s to its relative and absolute package paths', (packageName, relativePath) => {
        expect(getTrezorPackageRelativePath(packageName)).toBe(relativePath);
        expect(getTrezorPackageDir(packageName)).toBe(path.join(root, relativePath));
    });

    it('prints only the absolute directory when run from outside the repository', () => {
        const result = spawnSync(
            process.execPath,
            [scriptPath, 'network-module-suite-common-types'],
            {
                cwd: os.tmpdir(),
                encoding: 'utf8',
            },
        );

        expect(result.status).toBe(0);
        expect(result.stderr).toBe('');
        expect(result.stdout).toBe(
            path.join(root, 'networks/network-module/suite-common/suite-common-types'),
        );
    });

    it('does not print a directory when the network package is unknown', () => {
        const result = spawnSync(process.execPath, [scriptPath, 'network-does-not-exist'], {
            encoding: 'utf8',
        });

        expect(result.status).toBe(1);
        expect(result.stdout).toBe('');
        expect(result.stderr).toContain(
            'Package @trezor/network-does-not-exist not found in ./networks',
        );
    });

    it('reports usage when the package argument is missing', () => {
        const result = spawnSync(process.execPath, [scriptPath], { encoding: 'utf8' });

        expect(result.status).toBe(1);
        expect(result.stdout).toBe('');
        expect(result.stderr).toContain(
            'Usage: node ./scripts/ci/trezor-package-path.ts <packageName>',
        );
    });
});
