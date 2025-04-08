import TrezorConnect from '@trezor/connect-web';

import { expect, test } from '../../support/fixtures';

test.describe('TrezorConnect', { tag: ['@group=suite', '@desktopOnly'] }, () => {
    test.use({ electronConf: { exposeConnectWs: true } });
    test.beforeEach(async ({ onboardingPage, dashboardPage }) => {
        await onboardingPage.completeOnboarding();
        await dashboardPage.discoveryShouldFinish();
        await test.step('Initialize TrezorConnect', async () => {
            await TrezorConnect.init({
                manifest: {
                    appUrl: 'http://localhost:8080',
                    email: '',
                    appName: 'Tester',
                },
                coreMode: 'suite-desktop',
                debug: true,
            });
        });
    });

    test('TrezorConnect.getAddress', async ({ connectModal, trezorUserEnvLink }) => {
        const res = TrezorConnect.getAddress({
            path: "m/44'/0'/0'/0/0",
            coin: 'btc',
        });

        // export single address
        await expect(connectModal.header).toHaveText('Export Bitcoin address');
        await expect(connectModal.processParagraph).toHaveText('Process: node');
        await expect(connectModal.rememberCheckbox).toHaveText('Always allow for this app');
        await connectModal.confirmButton.click();
        await trezorUserEnvLink.pressYes();
        expect((await res).success).toBe(true);

        // export multiple addresses
        const resMultiple = TrezorConnect.getAddress({
            bundle: [
                {
                    path: "m/44'/0'/0'/0/0",
                    coin: 'btc',
                },
                {
                    path: "m/44'/0'/0'/0/0",
                    coin: 'btc',
                },
            ],
        });
        await expect(connectModal.header).toHaveText('Export multiple Bitcoin addresses');
        await connectModal.confirmButton.click();
        await trezorUserEnvLink.pressYes();
        await trezorUserEnvLink.pressYes();
        expect((await resMultiple).success).toBe(true);
    });
});

// todo: write tests:
// - connect request is accepted when all kind of weird stuff is happening
//   - discovery is in progress
//   - onboarding is in progress
//   - recovery/backup is in progress
//   - device is not connected
//   - device is used by another application
//   - device is not initialized, device is in bootloader
// - permissions, grant, revoke, settings page
