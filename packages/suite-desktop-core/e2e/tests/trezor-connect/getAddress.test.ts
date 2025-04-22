import TrezorConnect from '@trezor/connect-web';

import { expect, test } from '../../support/fixtures';

test.describe('TrezorConnect.getAddress', { tag: ['@group=suite', '@desktopOnly'] }, () => {
    test.use({ electronConf: { exposeConnectWs: true } });
    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding();
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

    test('TrezorConnect.getAddress', async ({
        page,
        connectPermissionsModal,
        trezorUserEnvLink,
    }) => {
        const res = TrezorConnect.getAddress({
            path: "m/44'/0'/0'/0/0",
            coin: 'btc',
        });

        await connectPermissionsModal.confirmButton.click();

        // export single address
        await expect(connectPermissionsModal.loadingHeader).toHaveText('Export Bitcoin address');
        await page.getByTestId('@connect-address-confirmation/verify-button').click();
        expect(page.getByTestId('@connect-address-confirmation/verify-button')).toBeDisabled();
        await trezorUserEnvLink.pressYes();
        // todo: verified badge appears

        expect(await res).toMatchObject({ success: true });

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
        await connectPermissionsModal.confirmButton.click();
        await expect(connectPermissionsModal.loadingHeader).toHaveText(
            'Export multiple Bitcoin addresses',
        );

        expect(await resMultiple).toMatchObject({ success: true });
    });

    // todo: use account not available in suite (weird derivation path)
});
