import { conditionalDescribe } from '@suite-common/test-utils';
import { PROTO } from '@trezor/connect';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { onboardingCompleted } from '../fixtures/onboardingCompleted';
import { onAlertSheet } from '../pageObjects/alertSheetActions';
import { onSettings } from '../pageObjects/settingsActions';
import { onTabBar } from '../pageObjects/tabBarActions';
import {
    appIsFullyLoaded,
    disconnectTrezorUserEnv,
    openApp,
    prepareTrezorEmulator,
    wait,
} from '../utils';

const navigateToEjectWallets = async () => {
    await onTabBar.navigateToSettings();
    await onSettings.tapEjectWallets();
};

conditionalDescribe(device.getPlatform() === 'android', 'Eject wallets', () => {
    beforeEach(async () => {
        await prepareTrezorEmulator();
        await openApp({
            newInstance: true,
            args: {
                preloadedState: {
                    appSettings: {
                        ...onboardingCompleted?.appSettings,
                        isCoinEnablingInitFinished: true,
                    },
                    wallet: {
                        settings: {
                            enabledNetworks: ['btc'],
                            localCurrency: 'usd',
                            discreetMode: false,
                            hideSuspiciousTransactions: false,
                            bitcoinAmountUnit: PROTO.AmountUnit.BITCOIN,
                        },
                    },
                },
            },
        });
        await appIsFullyLoaded();
        await wait(5000); // wait for trezor device to start communicating with the app
    });

    afterAll(async () => {
        await disconnectTrezorUserEnv();
        await device.terminateApp();
    });

    it('Eject single wallet with connected device', async () => {
        await waitFor(
            element(by.id('@device-manager/device-switch').withDescendant(by.text('Connected'))),
        )
            .toBeVisible()
            .withTimeout(10000);

        await navigateToEjectWallets();
        await onSettings.ejectSingleWallet();

        // Navigate home
        await device.pressBack();
        await device.pressBack();

        await waitFor(
            element(by.id('@device-manager/device-switch').withDescendant(by.text('Connected'))),
        )
            .toBeVisible()
            .withTimeout(10000);

        await TrezorUserEnvLink.stopBridge();

        await waitFor(
            element(by.id('@device-manager/device-switch').withDescendant(by.text('Hi there!'))),
        )
            .toBeVisible()
            .withTimeout(10000);
    });

    it('Eject single wallet with disconnected device', async () => {
        await waitFor(
            element(by.id('@device-manager/device-switch').withDescendant(by.text('Connected'))),
        )
            .toBeVisible()
            .withTimeout(10000);

        await TrezorUserEnvLink.stopBridge();

        await waitFor(
            element(by.id('@device-manager/device-switch').withDescendant(by.text('Disconnected'))),
        )
            .toBeVisible()
            .withTimeout(10000);

        await navigateToEjectWallets();
        await onSettings.ejectSingleWallet();

        // Navigate home
        await device.pressBack();
        await device.pressBack();

        await waitFor(
            element(by.id('@device-manager/device-switch').withDescendant(by.text('Hi there!'))),
        )
            .toBeVisible()
            .withTimeout(10000);
    });

    it('Auto eject settings toggle switch', async () => {
        await navigateToEjectWallets();

        await onSettings.toggleAutoEject();
        await onAlertSheet.tapPrimaryButton();
        await TrezorUserEnvLink.stopBridge();

        await waitFor(
            element(by.id('@device-manager/device-switch').withDescendant(by.text('Hi there!'))),
        )
            .toBeVisible()
            .withTimeout(10000);
    });
});
