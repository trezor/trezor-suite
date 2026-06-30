import TrezorConnect from '@trezor/connect-web';

import { expect, test } from '../../support/fixtures';

test.describe('TrezorConnect.selectAccount', { tag: ['@T3T1', '@T3W1', '@desktopOnly'] }, () => {
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

    test('selects and verifies an account (multi)', async ({
        page,
        device,
        connectPermissionsModal,
        connectSelectAccountModal,
    }) => {
        const res = TrezorConnect.selectAccount({
            coin: 'eth',
            selectionType: 'multi',
        });

        await connectPermissionsModal.confirmButton.click();

        // picker opens and shows the first account
        await expect(connectSelectAccountModal.account(0)).toBeVisible();

        // select account #0
        await connectSelectAccountModal.checkbox(0).click();

        // verify it on the device
        await connectSelectAccountModal.verifyButton(0).click();
        await expect(connectSelectAccountModal.verifyButton(0)).toHaveTranslation('TR_VERIFYING');
        // TODO: 'verifying' is not enough to ensure the device call is already in progress, it is
        // only set right after clicking the button (see getAddress.test.ts for the same caveat).
        await page.waitForTimeout(1000);
        await device.pressYes();
        await expect(connectSelectAccountModal.verifiedBadge(0)).toBeVisible();

        // connect: delivers the selection to the app
        await connectSelectAccountModal.confirmButton.click();

        const response = await res;
        expect(response.success).toBe(true);
        if (!response.success) return;

        const accounts = response.payload;
        expect(accounts).toHaveLength(1);
        const [account] = accounts;
        if (!account) return;
        expect(account.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
        expect(account.path).toContain("m/44'/60'/0'/0/0");
        // privacy: never expose an xpub / public key
        expect(account).not.toHaveProperty('xpub');
        expect(account).not.toHaveProperty('publicKey');

        // the modal stays open after export so the user can double-check the shared addresses
        await expect(connectSelectAccountModal.closeButton).toBeVisible();
        await connectSelectAccountModal.closeButton.click();
    });

    test('returns a single account (single)', async ({
        connectPermissionsModal,
        connectSelectAccountModal,
    }) => {
        const res = TrezorConnect.selectAccount({
            coin: 'eth',
            selectionType: 'single',
            requireOnDeviceVerification: false,
        });

        await connectPermissionsModal.confirmButton.click();

        await expect(connectSelectAccountModal.account(0)).toBeVisible();
        await connectSelectAccountModal.checkbox(0).click();
        await connectSelectAccountModal.confirmButton.click();

        const response = await res;
        expect(response.success).toBe(true);
        if (!response.success) return;

        expect(response.payload).toHaveLength(1);
        const [account] = response.payload;
        if (!account) return;
        expect(account.address).toMatch(/^0x[0-9a-fA-F]{40}$/);

        // modal stays open after export; close it
        await connectSelectAccountModal.closeButton.click();
    });

    test('cancelling returns a Method_Cancel error', async ({
        connectPermissionsModal,
        connectSelectAccountModal,
    }) => {
        const res = TrezorConnect.selectAccount({ coin: 'eth' });

        await connectPermissionsModal.confirmButton.click();
        await expect(connectSelectAccountModal.account(0)).toBeVisible();
        await connectSelectAccountModal.cancelButton.click();

        const response = await res;
        expect(response.success).toBe(false);
        if (response.success) return;

        expect(response.error.code).toBe('Method_Cancel');
    });
});
