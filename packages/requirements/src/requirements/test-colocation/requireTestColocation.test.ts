import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import type { WorkspaceContext } from '../Requirement';
import {
    findTestColocationViolations,
    isTestColocationViolation,
    requireTestColocation,
    verifyTestColocation,
} from './requireTestColocation';

const createFile = (filePath: string): void => {
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, '');
};

describe(requireTestColocation.name, () => {
    let repoRoot: string;
    let workspaceDir: string;
    let context: WorkspaceContext;

    beforeEach(() => {
        repoRoot = mkdtempSync(join(tmpdir(), 'test-colocation-'));
        workspaceDir = join(repoRoot, 'packages', 'example');
        mkdirSync(workspaceDir, { recursive: true });
        context = {
            repoRoot,
            workspaceDir,
            workspaceName: '@trezor/example',
        };
    });

    afterEach(() => {
        rmSync(repoRoot, { recursive: true, force: true });
    });

    it('finds violations using the workspace file tree and skips generated directories', async () => {
        createFile(join(workspaceDir, 'src', '__tests__', 'example.test.ts'));
        createFile(join(workspaceDir, 'src', 'example.test.ts'));
        createFile(join(workspaceDir, 'node_modules', 'dependency', 'tests', 'ignored.test.ts'));
        createFile(join(workspaceDir, 'lib', 'tests', 'ignored.test.js'));

        const errors = await requireTestColocation.verify(context);

        expect(errors).toEqual([
            'packages/example/src/__tests__/example.test.ts is a non-E2E test in a legacy test directory. Co-locate it with its source file.',
        ]);
    });
});

describe('isTestColocationViolation', () => {
    it.each([
        'packages/example/tests/example.test.ts',
        'packages/example/test/example.spec.tsx',
        'packages/example/src/__tests__/example.test.js',
        'packages/example/tests/example.type-test.ts',
    ])('identifies a non-colocated test: %s', path => {
        expect(isTestColocationViolation(path)).toBe(true);
    });

    it.each([
        'packages/example/src/example.test.ts',
        'packages/example/tests/example.fixture.ts',
        'packages/example/src/__tests__/example.ts',
    ])('allows a compliant or non-test path: %s', path => {
        expect(isTestColocationViolation(path)).toBe(false);
    });

    it.each([
        'packages/connect/e2e/tests/example.test.ts',
        'packages/request-manager/e2e/tests/example.test.ts',
        'packages/transport-test/e2e/tests/example.test.ts',
        'packages/trezor-user-env-link/e2e/tests/example.test.ts',
        'packages/urls/tests/e2e/example.test.ts',
        'suite-native/app/e2e/tests/example.test.ts',
        'suite/e2e/tests/example.spec.ts',
    ])('allows a test in an explicitly exempt E2E path: %s', path => {
        expect(isTestColocationViolation(path)).toBe(false);
    });

    it.each([
        'packages/example/e2e/tests/example.test.ts',
        'packages/connect/e2e-other/tests/example.test.ts',
        'packages/example/playwright/tests/example.test.ts',
        'suite-native/app/detox/tests/example.test.ts',
    ])('does not exempt an unlisted path: %s', path => {
        expect(isTestColocationViolation(path)).toBe(true);
    });
});

describe('findTestColocationViolations', () => {
    it('returns sorted violation paths', () => {
        expect(
            findTestColocationViolations([
                'packages/zeta/tests/zeta.test.ts',
                'packages/alpha/__tests__/alpha.spec.ts',
                'packages/connect/e2e/tests/example.test.ts',
            ]),
        ).toEqual(['packages/alpha/__tests__/alpha.spec.ts', 'packages/zeta/tests/zeta.test.ts']);
    });
});

describe('verifyTestColocation', () => {
    it('passes when there are no violations', () => {
        expect(
            verifyTestColocation([
                'packages/example/src/example.test.ts',
                'packages/connect/e2e/tests/example.test.ts',
            ]),
        ).toEqual([]);
    });

    it('reports every violation in deterministic order', () => {
        expect(
            verifyTestColocation([
                'packages/zeta/tests/zeta.test.ts',
                'packages/example/src/example.test.ts',
                'packages/alpha/__tests__/alpha.test.ts',
            ]),
        ).toEqual([
            'packages/alpha/__tests__/alpha.test.ts is a non-E2E test in a legacy test directory. Co-locate it with its source file.',
            'packages/zeta/tests/zeta.test.ts is a non-E2E test in a legacy test directory. Co-locate it with its source file.',
        ]);
    });
});
