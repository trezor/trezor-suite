import TrezorConnect from '@trezor/connect-web';

import { expect, test } from '../../support/fixtures';
import { pressContinue } from '../../support/helpers/deviceInput';

test.describe(
    'TrezorConnect.ethereumSignMessage',
    { tag: ['@group=connect', '@desktopOnly'] },
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
            trezorUserEnvLink,
            page,
            model,
        }) => {
            const res = TrezorConnect.ethereumSignMessage({
                path: "m/44'/60'/0'",
                message: 'example message',
            });

            await connectPermissionsModal.confirmButton.click();

            const text = page.getByTestId('@sign-message-modal/message');
            await expect(text).toHaveText('example message');

            await pressContinue(model);
            await pressContinue(model);

            await trezorUserEnvLink.pressYes();
            expect(await res).toMatchObject({ success: true });
        });

        // todo: use account not available in suite (weird derivation path)
    },
);
