import TrezorConnect from '@trezor/connect-web';

import { expect, test } from '../../support/fixtures';

test.describe('TrezorConnect.composeTransaction', { tag: ['@group=suite', '@desktopOnly'] }, () => {
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

    test('TrezorConnect.composeTransaction - canceled from UI', async ({
        page,
        connectPermissionsModal,
    }) => {
        const res = TrezorConnect.composeTransaction({
            coin: 'btc',
            outputs: [
                {
                    amount: '498066',
                    address: '3L6TyTisPBmrDAj6RoKmDzNnj4eQi54gD2',
                },
            ],
        });

        await connectPermissionsModal.confirmButton.click();

        await page.getByTestId('@modal/close-button').click();
        await page.getByTestId('@modal').waitFor({ state: 'detached' });

        expect(await res).toMatchObject({ success: false });
    });

    // todo: success case (requires funds)
});
