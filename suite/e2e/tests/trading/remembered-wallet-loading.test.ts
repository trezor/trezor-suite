import dump from '../../fixtures/remembered-wallet-db-lite.json';
import { expect, test } from '../../support/fixtures';
import type { IndexedDbDump } from '../../support/indexedDb';

test.describe('Remembered wallet loading', { tag: ['@noDevice'] }, () => {
    test.use({
        startEmulator: false,
        setupEmulator: false,
    });

    test('Load remembered wallet and open receive forms without connected device', async ({
        page,
        indexedDb,
        walletPage,
    }) => {
        await test.step('Wait for Suite to initialize IndexedDB schema', async () => {
            await indexedDb.waitForInit();
        });

        await test.step('Seed remembered wallet from real DB dump', async () => {
            await indexedDb.seedFromDump(dump as IndexedDbDump);
        });

        await test.step('Reload Suite with remembered state', async () => {
            await expect(page.getByTestId('@suite/loading')).toBeHidden({ timeout: 20_000 });
            await expect(page.getByTestId('@suite/bundle-loader')).toBeHidden();
        });

        await test.step('Open receive from remembered wallet', async () => {
            await expect(walletPage.accountButton({ symbol: 'btc' })).toBeVisible();
            await expect(walletPage.deviceDisconnectedStatus).toBeVisible();

            await walletPage.openAccount({ symbol: 'eth', type: 'normal', atIndex: 0 });
            await walletPage.receiveButton.click();
        });
    });
});
