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

    test('Error screen', async ({ page }) => {
        TrezorConnect.ethereumGetAddress({ path: 'foo bar' });
        const modalErrorMessage = page.getByTestId('@connect-popup-error/message');
        await expect(modalErrorMessage).toHaveText('Not a valid path');
    });
});
