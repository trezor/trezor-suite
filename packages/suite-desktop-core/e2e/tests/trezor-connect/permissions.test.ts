import TrezorConnect from '@trezor/connect-web';

import { expect, test } from '../../support/fixtures';

test.describe('TrezorConnect', { tag: ['@group=connect', '@desktopOnly'] }, () => {
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

    test('Permissions - add and forget', async ({
        settingsPage,
        connectPermissionsModal,
        page,
    }) => {
        await settingsPage.navigateTo('connect');

        await page.getByTestId('@settings/connect-apps/no-apps').waitFor({ state: 'visible' });

        TrezorConnect.getAddress({
            path: "m/44'/0'/0'/0/0",
            coin: 'btc',
        });

        await expect(connectPermissionsModal.processParagraph).toHaveText('node');
        await expect(connectPermissionsModal.rememberCheckbox).toHaveText(
            'Always allow for this app',
        );
        await connectPermissionsModal.rememberCheckbox.click();
        await connectPermissionsModal.confirmButton.click();
        await page.getByTestId('@connect-address-confirmation/close-button').click();

        // permission is already saved, user won't be prompted again for this app
        TrezorConnect.getAddress({
            path: "m/44'/0'/0'/0/0",
            coin: 'btc',
        });
        await page.getByTestId('@connect-address-confirmation/close-button').click();
        await page.getByTestId(`@settings/connect-apps/0`).waitFor({ state: 'visible' });
        await page.getByTestId(`@settings/connect-apps/0/dropdown`).click();

        // todo: it looks like data-test is not passed down to list items in dropdown
        await page.getByText('Forget').click();
        await page.getByTestId('@settings/connect-apps/no-apps').waitFor({ state: 'visible' });

        // permissions modal appears again
        TrezorConnect.getAddress({
            path: "m/44'/0'/0'/0/0",
            coin: 'btc',
        });
        await expect(connectPermissionsModal.processParagraph).toHaveText('node');
    });
});
