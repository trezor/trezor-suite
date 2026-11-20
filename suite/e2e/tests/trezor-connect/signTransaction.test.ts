import TrezorConnect from '@trezor/connect-web';
import { TestStream } from '@trezor/e2e-utils';
import { Model } from '@trezor/trezor-user-env-link';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';
import { transformAddress } from '../../support/testExtends/customMatchers';

test.describe(
    'TrezorConnect.signTransaction',
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
            'TrezorConnect.signTransaction',
            { annotation: createTestAnnotation({ stream: TestStream.Connect }) },
            async ({ page, connectPermissionsModal, device }) => {
                TrezorConnect.signTransaction({
                    coin: 'btc',
                    inputs: [
                        {
                            address_n: [2147483692, 2147483648, 2147483648, 0, 5],
                            prev_hash:
                                '50f6f1209ca92d7359564be803cb2c932cde7d370f7cee50fd1fad6790f6206d',
                            prev_index: 1,
                            // todo: check what happens if we send incorrect data, for example missing amount
                            amount: '50000',
                        },
                    ],
                    outputs: [
                        {
                            address:
                                'bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3',
                            amount: '10000',
                            script_type: 'PAYTOADDRESS',
                        },
                    ],
                    chunkify: true,
                });

                await connectPermissionsModal.confirmButton.click();

                await page.getByTestId('@prompts/confirm-on-device').waitFor({ state: 'visible' });
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Send' },
                        body: [
                            transformAddress(
                                'bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3',
                                'fourTetragrams',
                            ),
                        ],
                        actions: { right_button: 'Continue' },
                    },
                    T3T1: {
                        header: { title: 'Address', subtitle: 'Recipient #1' },
                    },
                });
                await device.pressContinue();
                await page
                    .getByTestId('@prompts/confirm-on-device/step/1/active')
                    .waitFor({ state: 'visible' });
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Send' },
                        body: [['Amount'], ['0.0001 BTC']],
                        actions: { right_button: 'Confirm' },
                    },
                    T3T1: {
                        header: { title: 'Amount', subtitle: 'Recipient #1' },
                        body: [['0.0001 BTC']],
                    },
                });
                await device.pressContinue();
                await page
                    .getByTestId('@prompts/confirm-on-device/step/2/active')
                    .waitFor({ state: 'visible' });
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Send' },
                        body: [
                            ['Total amount'],
                            ['0.0005 BTC'],
                            ['incl. Transaction fee'],
                            ['0.0004 BTC'],
                        ],
                        actions: { right_button: 'Hold to sign' },
                    },
                    T3T1: {
                        header: { title: 'Summary' },
                    },
                });
                await device.pressContinue();

                if (device.model !== Model.T3W1) {
                    await device.expectToContainOnDisplay('Sign transaction');
                }
                await device.pressYes();

                await page
                    .getByText('Input does not match scriptPubKey')
                    .waitFor({ state: 'visible' });
            },
        );
    },
);
