import TrezorConnect from '@trezor/connect-web';
import { TestStream } from '@trezor/e2e-utils';
import { Model } from '@trezor/trezor-user-env-link';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';
import { transformAddress } from '../../support/testExtends/customMatchers';

test.describe(
    'TrezorConnect.ethereumSignMessage',
    { tag: ['@T3T1', '@T3W1', '@desktopOnly', '@windows'] },
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

        test(
            'TrezorConnect.ethereumSignMessage',
            { annotation: createTestAnnotation({ stream: TestStream.Connect }) },
            async ({ connectPermissionsModal, page, device }) => {
                const res = TrezorConnect.ethereumSignMessage({
                    path: "m/44'/60'/0'",
                    message: 'example message',
                });

                await connectPermissionsModal.confirmButton.click();

                const text = page.getByTestId('@sign-message-modal/message');
                await expect(text).toHaveText('example message');

                await page.getByTestId('@prompts/confirm-on-device').waitFor({ state: 'visible' });
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Signing address' },
                        body: [
                            transformAddress(
                                '0xAE2B111b634f8FB3942B13b98c824B0F1060cacB',
                                'fullLine',
                            ),
                        ],
                        actions: { right_button: 'Continue' },
                    },
                });
                await device.pressContinue();
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Confirm message' },
                        body: [['example message']],
                        actions: { right_button: 'Hold to confirm' },
                    },
                });
                await device.pressContinue();

                if (device.model !== Model.T3W1) {
                    await device.expectToContainOnDisplay('Confirm message');
                }
                await device.pressYes();
                expect(await res).toMatchObject({ success: true });
            },
        );

        // todo: use account not available in suite (weird derivation path)
    },
);
