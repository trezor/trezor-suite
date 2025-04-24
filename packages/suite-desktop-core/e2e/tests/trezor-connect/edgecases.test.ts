import TrezorConnect from '@trezor/connect-web';

import { expect, test } from '../../support/fixtures';

test.describe('TrezorConnect', { tag: ['@group=suite', '@desktopOnly'] }, () => {
    test.use({ electronConf: { exposeConnectWs: true } });
    test.beforeEach(async () => {
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

    test('connect call initiated while discovery still in progress', async ({
        connectPermissionsModal,
        page,
        onboardingPage,
        analyticsSection,
    }) => {
        // pass onboarding (without discovery) start
        await onboardingPage.disableNecessaryFirmwareChecks();
        await onboardingPage.optionallyDismissFwHashCheckError();
        await analyticsSection.continueButton.click();
        await onboardingPage.onboardingContinueButton.click();
        if (onboardingPage.isModelWithSecureElement()) {
            await onboardingPage.passThroughAuthenticityCheck();
        }
        await onboardingPage.onboardingViewOnlySkipButton.click();
        await onboardingPage.viewOnlyTooltipGotItButton.click();

        TrezorConnect.getAddress({
            path: "m/44'/0'/0'/0/0",
            coin: 'btc',
        });

        // TODO: connect permissions modal quickly appears and disappears. this is some race condition with discovery interruption
        await expect(connectPermissionsModal.processParagraph).toHaveText('node');

        // TODO: discovery is interrupted, probably CLOSE_UI_WINDOW is fired from connect core, which closes connect permissions modal
        await page.getByTestId('@dashboard/wallet-ready').waitFor({ state: 'visible' });
    });

    test('device disconnected on permissions page', async ({
        onboardingPage,
        connectPermissionsModal,
        trezorUserEnvLink,
        page,
    }) => {
        await onboardingPage.completeOnboarding();
        TrezorConnect.getAddress({
            path: "m/44'/0'/0'/0/0",
            coin: 'btc',
        });
        await expect(connectPermissionsModal.processParagraph).toHaveText('node');

        await trezorUserEnvLink.stopEmu();

        // general "connect device" full screen appears;
        // TODO: is that ok? maybe it should be inside connect-error screen?
        await page.getByTestId('@connect-device-prompt').waitFor({ state: 'visible' });

        // TODO: now connect call does not resolve - it waits for ui-select_device event response even if I reconnect device
    });

    test('device disconnected after permissions page', async ({
        onboardingPage,
        connectPermissionsModal,
        trezorUserEnvLink,
        page,
    }) => {
        await onboardingPage.completeOnboarding();
        TrezorConnect.getAddress({
            path: "m/44'/0'/0'/0/0",
            coin: 'btc',
        });

        await connectPermissionsModal.confirmButton.click();

        await page.getByTestId('@connect-address-confirmation/verify-button').click();

        // wait for 100 ms, TODO: should check call in progress in UI
        await page.waitForTimeout(100);

        await trezorUserEnvLink.stopEmu();

        // todo: better selector
        await page.getByText('Error').waitFor({ state: 'visible' });

        // todo: there is still verify button present, it should be disabled, probably with some tooltip?
    });

    test.skip('another connect call is issued during an active call', async ({
        onboardingPage,
        connectPermissionsModal,
        page,
    }) => {
        await onboardingPage.completeOnboarding();
        const res1 = TrezorConnect.getAddress({
            path: "m/44'/0'/0'/0/0",
            coin: 'btc',
        });

        const res2 = TrezorConnect.getAddress({
            path: "m/44'/0'/0'/0/0",
            coin: 'btc',
        });

        await connectPermissionsModal.confirmButton.click();
        await page.getByTestId('@connect-address-confirmation/close-button').click();

        expect(await res1).toMatchObject({ success: true });

        await connectPermissionsModal.confirmButton.click();
        await page.getByTestId('@connect-address-confirmation/close-button').click();

        expect(await res2).toMatchObject({ success: true });
    });

    test('connect call is while there is get address button request initiated by suite', async ({
        onboardingPage,
        walletPage,
        page,
        connectPermissionsModal,
        trezorUserEnvLink,
    }) => {
        await onboardingPage.completeOnboarding();
        await walletPage.openAccount();
        await walletPage.receiveButton.click();
        await page.getByTestId('@wallet/receive/reveal-address-button').click();

        // get address screen active
        await page.getByTestId('@prompts/confirm-on-device').waitFor({ state: 'visible' });
        // connect call is issued simultaneously, there is no immediate visual feedback
        // TODO: discuss visual feedback with Hans
        // but it still magically works thanks to synchronization of connect calls in renderer
        const res = TrezorConnect.getAddress({
            path: "m/44'/0'/0'/0/0",
            coin: 'btc',
        });
        await trezorUserEnvLink.pressNo();

        // connect permissions modal appear, connect flow takes over
        await connectPermissionsModal.confirmButton.click();
        expect(await res).toMatchObject({ success: true });
    });
});

// todo: write tests:
// - connect request is accepted when all kind of weird stuff is happening
//   - onboarding is in progress
//   - recovery/backup is in progress
//   - device is not connected
//   - device is used by another application
//   - device is not initialized, device is in bootloader
// - permissions, grant, revoke, settings page
