import TrezorConnect from '@trezor/connect-web';

import { expect, test } from '../../support/fixtures';

test.describe('TrezorConnect.signMessage', { tag: ['@T3T1', '@T3W1', '@desktopOnly'] }, () => {
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

    test('TrezorConnect.signMessage with path', async ({
        connectPermissionsModal,
        page,
        device,
    }) => {
        const res = TrezorConnect.signMessage({
            path: "m/84'/0'/0'/0/0",
            coin: 'btc',
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

    test('TrezorConnect.signMessage with address instead of path', async ({
        connectPermissionsModal,
        page,
        device,
    }) => {
        // First, get a Bitcoin address from the device to use it in signMessage
        const getAddressRes = TrezorConnect.getAddress({
            path: "m/84'/0'/0'/0/0",
            coin: 'btc',
            showOnTrezor: false,
        });
        await connectPermissionsModal.confirmButton.click();
        const addressResult = await getAddressRes;
        expect(addressResult.success).toBe(true);
        if (!addressResult.success) return;
        const { address } = addressResult.payload;

        // Now sign a message using address instead of path
        const res = TrezorConnect.signMessage({
            address,
            coin: 'btc',
            message: 'example message',
        });

        const text = page.getByTestId('@sign-message-modal/message');
        await expect(text).toHaveText('example message');

        await device.pressContinue();
        await device.pressContinue();

        await device.pressYes();
        expect(await res).toMatchObject({ success: true });
    });
});
