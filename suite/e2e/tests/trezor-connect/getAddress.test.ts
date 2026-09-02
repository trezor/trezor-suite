import TrezorConnect from '@trezor/connect-web';
import { TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

test.describe('TrezorConnect.getAddress', { tag: ['@T3T1', '@T3W1', '@desktopOnly'] }, () => {
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
        'TrezorConnect.getAddress',
        { annotation: createTestAnnotation({ stream: TestStream.Connect }) },
        async ({ page, device, connectPermissionsModal }) => {
            await test.step('export single address - and manually request on device confirmation', async () => {
                const res = TrezorConnect.getAddress({
                    path: "m/44'/0'/0'/0/0",
                    coin: 'btc',
                    showOnTrezor: false,
                });

                await connectPermissionsModal.confirmButton.click();

                // export single address
                await expect(connectPermissionsModal.loadingHeader).toHaveText(
                    'Export Bitcoin address',
                );
                await page.getByTestId('@connect-address-confirmation/confirm-button').click();
                await page.getByTestId('@connect-address-confirmation/verify-button/0').click();
                await expect(
                    page.getByTestId('@connect-address-confirmation/verify-button/0'),
                ).toBeDisabled();

                // TODO: 'verifying' is not enough to ensure device call is already in progress, it is only set right after clicking the button.
                // we can't use buttonRequests at the moment because of switching between DeviceContextModal and UserContextModal which causes animation flickering
                await page.waitForTimeout(1000);
                await device.pressYes();

                await expect(
                    page.getByTestId('@connect-address-confirmation/verified-badge/0'),
                ).toBeVisible();

                expect(await res).toMatchObject({ success: true });
            });

            await test.step('export multiple addresses', async () => {
                const resMultiple = TrezorConnect.getAddress({
                    bundle: [
                        {
                            path: "m/44'/0'/0'/0/0",
                            coin: 'btc',
                            showOnTrezor: false,
                        },
                        {
                            path: "m/44'/0'/0'/0/1",
                            coin: 'btc',
                        },
                    ],
                });

                await connectPermissionsModal.confirmButton.click();

                await expect(connectPermissionsModal.loadingHeader).toHaveText(
                    'Export multiple Bitcoin addresses',
                );
                await page.getByTestId('@connect-address-confirmation/confirm-button').click();

                // click on the second (last) address
                await page.getByTestId('@connect-address-confirmation/verify-button/1').click();

                await expect(
                    page.getByTestId('@connect-address-confirmation/verify-button/0'),
                ).toBeDisabled();
                await expect(
                    page.getByTestId('@connect-address-confirmation/verify-button/1'),
                ).toHaveTranslation('TR_VERIFYING');

                // TODO: 'verifying' is not enough to ensure device call is already in progress, it is only set right after clicking the button.
                await page.waitForTimeout(1000);
                await device.pressYes();
                expect(await resMultiple).toMatchObject({ success: true });
            });

            await test.step('export address with forced on device confirmation', async () => {
                TrezorConnect.getAddress({
                    path: "m/44'/0'/0'/0/0",
                    coin: 'btc',
                    showOnTrezor: true, // <- force confirmation
                });

                await connectPermissionsModal.confirmButton.click();
                await page.getByTestId('@connect-address-confirmation/confirm-button').click();

                await expect(
                    page.getByTestId('@connect-address-confirmation/verify-button/0'),
                ).toBeDisabled();
                await expect(
                    page.getByTestId('@connect-address-confirmation/verify-button/0'),
                ).toHaveTranslation('TR_VERIFYING');

                // TODO: 'verifying' is not enough to ensure device call is already in progress, it is only set right after clicking the button.
                await page.waitForTimeout(1000);
                await device.pressYes();

                await expect(
                    page.getByTestId('@connect-address-confirmation/verified-badge/0'),
                ).toBeVisible();

                // try to verify address and disconnect device during action
                await page.getByTestId('@connect-address-confirmation/verify-button/0').click();
                await page.waitForTimeout(1000);
                await device.pressNo();
                await page
                    .getByTestId('@connect-address-confirmation/error-badge/0')
                    .waitFor({ state: 'visible' });
            });
        },
    );

    // todo: use account not available in suite (weird derivation path)
});
