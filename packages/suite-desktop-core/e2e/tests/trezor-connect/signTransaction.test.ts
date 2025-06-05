import TrezorConnect from '@trezor/connect-web';

import { test } from '../../support/fixtures';

test.describe('TrezorConnect.signTransaction', { tag: ['@group=connect', '@desktopOnly'] }, () => {
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

    test('TrezorConnect.signTransaction', async ({
        page,
        connectPermissionsModal,
        trezorUserEnvLink,
    }) => {
        TrezorConnect.signTransaction({
            coin: 'btc',
            inputs: [
                {
                    address_n: [2147483692, 2147483648, 2147483648, 0, 5],
                    prev_hash: '50f6f1209ca92d7359564be803cb2c932cde7d370f7cee50fd1fad6790f6206d',
                    prev_index: 1,
                    // todo: check what happens if we send incorrect data, for example missing amount
                    amount: '50000',
                },
            ],
            outputs: [
                {
                    address: 'bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3',
                    amount: '10000',
                    script_type: 'PAYTOADDRESS',
                },
            ],
            chunkify: true,
        });

        await connectPermissionsModal.confirmButton.click();

        await page.getByTestId('@prompts/confirm-on-device').waitFor({ state: 'visible' });

        await trezorUserEnvLink.swipeEmu('up');

        await page
            .getByTestId('@prompts/confirm-on-device/step/1/active')
            .waitFor({ state: 'visible' });

        await trezorUserEnvLink.swipeEmu('up');

        await page
            .getByTestId('@prompts/confirm-on-device/step/2/active')
            .waitFor({ state: 'visible' });

        await trezorUserEnvLink.swipeEmu('up');

        await trezorUserEnvLink.pressYes();

        await page.getByText('Input does not match scriptPubKey').waitFor({ state: 'visible' });
    });
});
