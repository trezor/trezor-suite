import TrezorConnect from '@trezor/connect-web';

import { expect, test } from '../../support/fixtures';

test.describe(
    'TrezorConnect.ethereumSignTransaction',
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

        test('TrezorConnect.ethereumSignTransaction', async ({
            connectPermissionsModal,
            trezorUserEnvLink,
            page,
        }) => {
            const res = TrezorConnect.ethereumSignTransaction({
                path: "m/44'/60'/0'/0/0",
                transaction: {
                    nonce: '0x0',
                    gasPrice: '0x14',
                    gasLimit: '0x14',
                    to: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
                    chainId: 1,
                    value: '0x0',
                    data: '0xa9059cbb000000000000000000000000D6971aabeDC7f2A8113679199FE374aE1B1Aea96000000000000000000000000000000000000000000000000000000000097f6b2',
                },
            });

            await connectPermissionsModal.confirmButton.click();
            await expect(connectPermissionsModal.loadingHeader).toHaveText(
                'Sign Ethereum transaction',
            );

            await page
                .getByTestId('@prompts/confirm-on-device/step/0/active')
                .waitFor({ state: 'visible' });
            await trezorUserEnvLink.swipeEmu('up');

            await page
                .getByTestId('@prompts/confirm-on-device/step/1/active')
                .waitFor({ state: 'visible' });
            await trezorUserEnvLink.pressYes();

            expect(await res).toMatchObject({ success: true });
        });
    },
);
