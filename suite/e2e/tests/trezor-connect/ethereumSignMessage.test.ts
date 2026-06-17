import TrezorConnect from '@trezor/connect-web';

import { expect, test } from '../../support/fixtures';

test.describe(
    'TrezorConnect.ethereumSignMessage',
    { tag: ['@T3T1', '@T3W1', '@desktopOnly'] },
    () => {
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

        test('TrezorConnect.ethereumSignMessage', async ({
            connectPermissionsModal,
            page,
            device,
        }) => {
            const res = TrezorConnect.ethereumSignMessage({
                path: "m/44'/60'/0'",
                message: 'example message',
            });

            await connectPermissionsModal.confirmButton.click();

            const text = page.getByTestId('@sign-message-modal/message');
            await expect(text).toHaveText('example message');

            await device.pressContinue();
            await device.pressContinue();

            await device.pressYes();
            expect(await res).toMatchObject({ success: true });
        });

        // todo: use account not available in suite (weird derivation path)
    },
);
