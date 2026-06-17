import TrezorConnect from '@trezor/connect-web';

import { expect, test } from '../../support/fixtures';

test.describe('TrezorConnect.getAccountInfo', { tag: ['@T3T1', '@T3W1', '@desktopOnly'] }, () => {
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

    test('TrezorConnect.getAccountInfo', async ({ page, connectPermissionsModal }) => {
        const res = TrezorConnect.getAccountInfo({
            coin: 'btc',
        });

        await expect(connectPermissionsModal.confirmButton).toHaveText(
            'Proceed to account selection',
        );

        await connectPermissionsModal.confirmButton.click();

        await page.getByTestId('@select-account-modal/subtab/p2wpkh').click();
        await page.getByTestId(`@select-account-modal/accounts/p2wpkh/1`).click();

        expect(await res).toMatchObject({ success: true });

        // todo: I would greatly appreciate some kind of visual feedback that the call was finished successfully
    });
});
