import { updateConnectChangelog } from './update-connect-changelog';

describe('updateConnectChangelog', () => {
    it('preserves the migration introduction and updates its guide URLs', () => {
        const changelog = [
            '> **Upgrading from Connect 9?**',
            '>',
            '> - [Migration guide: Connect 9 → 10](https://connect.trezor.io/10.0.0-beta.1/guides/migrating-to-connect-10) — what you need to change in your code, as a checklist.',
            '> - [New Connect flow in Trezor Suite](https://connect.trezor.io/10.0.0-beta.1/guides/new-connect-flow-in-trezor-suite) — how the Suite-hosted flow works and why.',
            '',
            '|             Package              | Stable |    Canary     |',
            '| :------------------------------: | :----: | :-----------: |',
            '|       npm @trezor/connect        |   -    | 10.0.0-beta.1 |',
            '|     npm @trezor/connect-web      |   -    | 10.0.0-beta.1 |',
            '| npm @trezor/connect-webextension |   -    | 10.0.0-beta.1 |',
            '|    npm @trezor/connect-mobile    |   -    | 10.0.0-beta.1 |',
            '',
            '|     Deployment     | Stable |    Canary     |',
            '| :----------------: | :----: | :-----------: |',
            '| connect.trezor.io/ |   -    | 10.0.0-beta.1 |',
            '',
            'Release notes: https://connect.trezor.io/10.0.0-beta.1/guides/migrating-to-connect-10.',
        ].join('\n');

        const updatedChangelog = updateConnectChangelog({
            changelog,
            version: '10.0.0-beta.2',
            versionTable: '| Package | Stable | Canary |\n',
            deploymentTable: '| Deployment | Stable | Canary |\n',
        });

        expect(updatedChangelog).toContain('> **Upgrading from Connect 9?**');
        expect(updatedChangelog).toContain(
            'https://connect.trezor.io/10.0.0-beta.2/guides/migrating-to-connect-10',
        );
        expect(updatedChangelog).toContain(
            'https://connect.trezor.io/10.0.0-beta.2/guides/new-connect-flow-in-trezor-suite',
        );
        expect(updatedChangelog).toContain('Suite-hosted flow works and why.\n\n| Package');
        expect(updatedChangelog).toContain(
            'Release notes: https://connect.trezor.io/10.0.0-beta.1/guides/migrating-to-connect-10.',
        );
        expect(updatedChangelog).not.toContain('|    npm @trezor/connect-mobile    |');
    });
});
