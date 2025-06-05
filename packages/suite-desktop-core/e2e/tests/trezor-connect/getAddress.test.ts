import TrezorConnect from '@trezor/connect-web';

import { expect, test } from '../../support/fixtures';

test.describe('TrezorConnect.getAddress', { tag: ['@group=connect', '@desktopOnly'] }, () => {
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

    test('TrezorConnect.getAddress', async ({
        page,
        connectPermissionsModal,
        trezorUserEnvLink,
    }) => {
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
            await page.getByTestId('@connect-address-confirmation/verify-button/0').click();
            await expect(
                page.getByTestId('@connect-address-confirmation/verify-button/0'),
            ).toBeDisabled();

            // TODO: 'verifying' is not enough to ensure device call is already in progress, it is only set right after clicking the button.
            // we can't use buttonRequests at the moment because of switching between DeviceContextModal and UserContextModal which causes animation flickering
            await page.waitForTimeout(1000);
            await trezorUserEnvLink.pressYes();

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

            // click on the second (last) address
            await page.getByTestId('@connect-address-confirmation/verify-button/1').click();

            await expect(
                page.getByTestId('@connect-address-confirmation/verify-button/0'),
            ).toBeDisabled();
            await expect(
                page.getByTestId('@connect-address-confirmation/verify-button/1'),
            ).toHaveText('Verifying');

            // TODO: 'verifying' is not enough to ensure device call is already in progress, it is only set right after clicking the button.
            await page.waitForTimeout(1000);
            await trezorUserEnvLink.pressYes();
            expect(await resMultiple).toMatchObject({ success: true });
        });

        await test.step('export address with forced on device confirmation', async () => {
            TrezorConnect.getAddress({
                path: "m/44'/0'/0'/0/0",
                coin: 'btc',
                showOnTrezor: true, // <- force confirmation
            });

            await connectPermissionsModal.confirmButton.click();
            await expect(
                page.getByTestId('@connect-address-confirmation/verify-button/0'),
            ).toBeDisabled();
            await expect(
                page.getByTestId('@connect-address-confirmation/verify-button/0'),
            ).toHaveText('Verifying');

            // TODO: 'verifying' is not enough to ensure device call is already in progress, it is only set right after clicking the button.
            await page.waitForTimeout(1000);
            await trezorUserEnvLink.pressYes();

            expect(
                page.getByTestId('@connect-address-confirmation/verified-badge/0'),
            ).toBeVisible();

            // try to verify address and disconnect device during action
            await page.getByTestId('@connect-address-confirmation/verify-button/0').click();
            await page.waitForTimeout(1000);
            await trezorUserEnvLink.pressNo();
            await page
                .getByTestId('@connect-address-confirmation/error-badge/0')
                .waitFor({ state: 'visible' });
        });
    });

    // todo: use account not available in suite (weird derivation path)
});
