import type { WorkspacePackage } from '../connectClosure';
import { buildEasignoreContent, collectMobileWorkspaceClosure } from './easignoreContent';

const createPackages = (
    entries: ReadonlyArray<[string, string, Partial<WorkspacePackage['packageJson']>]>,
): ReadonlyMap<string, WorkspacePackage> =>
    new Map(
        entries.map(([name, dir, packageJson]) => [
            name,
            { name, dir, packageJson: { name, ...packageJson } } as WorkspacePackage,
        ]),
    );

describe('collectMobileWorkspaceClosure', () => {
    it('follows workspace ranges in every dependency field', () => {
        const packages = createPackages([
            [
                '@suite-native-app/app',
                'suite-native-app/app',
                {
                    dependencies: { '@suite-common/wallet': 'workspace:*' },
                    devDependencies: { '@suite-native/storybook': 'workspace:*' },
                },
            ],
            [
                '@suite-common/wallet',
                'suite-common/wallet',
                { dependencies: { '@trezor/utils': 'workspace:*' } },
            ],
            ['@suite-native/storybook', 'suite-native/storybook', {}],
            ['@trezor/utils', 'packages/utils', {}],
        ]);

        expect([...collectMobileWorkspaceClosure(packages)].sort()).toEqual([
            '@suite-common/wallet',
            '@suite-native-app/app',
            '@suite-native/storybook',
            '@trezor/utils',
        ]);
    });

    it('ignores desktop packages that nothing in the mobile graph reaches', () => {
        const packages = createPackages([
            ['@suite-native-app/app', 'suite-native-app/app', {}],
            [
                '@suite/desktop-app-api-electron',
                'suite/desktop-app-api-electron',
                { dependencies: { '@suite/desktop-app-api': 'workspace:*' } },
            ],
            ['@suite/desktop-app-api', 'suite/desktop-app-api', {}],
        ]);

        expect([...collectMobileWorkspaceClosure(packages)]).toEqual(['@suite-native-app/app']);
    });

    it('does not follow registry ranges that shadow a workspace name', () => {
        const packages = createPackages([
            [
                '@suite-native-app/app',
                'suite-native-app/app',
                { dependencies: { '@trezor/utils': '^1.0.0' } },
            ],
            ['@trezor/utils', 'packages/utils', {}],
        ]);

        expect([...collectMobileWorkspaceClosure(packages)]).toEqual(['@suite-native-app/app']);
    });
});

describe('buildEasignoreContent', () => {
    it('excludes each level before re-including its allowed children', () => {
        const content = buildEasignoreContent(['packages/utils', 'suite-native-app/app']);
        const lines = content.split('\n');

        expect(lines).toContain('/*');
        expect(lines).toContain('!/packages');
        expect(lines).toContain('/packages/*');
        expect(lines).toContain('!/packages/utils');
        expect(lines.indexOf('!/packages')).toBeLessThan(lines.indexOf('/packages/*'));
        expect(lines.indexOf('/packages/*')).toBeLessThan(lines.indexOf('!/packages/utils'));
    });

    it('keeps the root files Yarn needs to install', () => {
        const lines = buildEasignoreContent([]).split('\n');

        expect(lines).toContain('!/package.json');
        expect(lines).toContain('!/yarn.lock');
        expect(lines).toContain('!/.yarnrc.yml');
        expect(lines).toContain('!/.yarn/releases');
    });

    it('excludes env files after the allowlist, keeping only the committed ones', () => {
        const lines = buildEasignoreContent(['suite-native-app/app']).split('\n');

        expect(lines).toContain('**/.env*');
        expect(lines.indexOf('!/suite-native-app/app')).toBeLessThan(lines.indexOf('**/.env*'));
        expect(lines.indexOf('**/.env*')).toBeLessThan(
            lines.indexOf('!/suite-native-app/app/.env.development'),
        );
    });
});
