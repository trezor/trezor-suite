import { Model, TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { autoEjectAlertShownState } from '../fixtures/autoEjectAlertShownState';
import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { regtestDiscoveryFinishedStateT3T1 } from '../fixtures/regtestDiscoveryFinishedStateT3T1';
import { regtestDiscoveryFinishedStateT3W1 } from '../fixtures/regtestDiscoveryFinishedStateT3W1';
import { onAlertSheet } from '../pageObjects/alertSheetActions';
import { onDeviceManager } from '../pageObjects/deviceManagerActions';
import { onSettings } from '../pageObjects/settingsActions';
import { onTabBar } from '../pageObjects/tabBarActions';
import { openApp, preparePreloadedReduxState, prepareTrezorEmulator } from '../support/setup';
import { getModelFromEnv } from '../support/utils';

const preloadedState = preparePreloadedReduxState(
    onboardingCompletedState,
    autoEjectAlertShownState,
    getModelFromEnv() === Model.T3T1
        ? regtestDiscoveryFinishedStateT3T1
        : regtestDiscoveryFinishedStateT3W1,
);

const navigateToEjectWallets = async () => {
    await onTabBar.navigateToSettings();
    await onSettings.openSection('eject-wallets');
};

describe('Eject wallets [@androidOnly @T3T1 @T3W1]', () => {
    beforeEach(async () => {
        await openApp({ args: { preloadedState } });
        await prepareTrezorEmulator();
    });

    // Two devices are displayed in device manager, one connected and one disconnected
    it('Eject single wallet with disconnected device', async () => {
        await onDeviceManager.assertDeviceSwitcherState({ title: 'Connected' });
        await TrezorUserEnvLink.stopEmu();

        await onDeviceManager.assertDeviceSwitcherState({ title: 'Disconnected' });
        await navigateToEjectWallets();
        await onSettings.ejectSingleWallet();

        // Navigate home
        await device.pressBack();
        await onTabBar.navigateToHome();

        await onDeviceManager.assertDeviceSwitcherState({ title: 'Hi there!' });
    });

    // Two devices are displayed in device manager, one connected and one disconnected
    it('Eject single wallet with connected device', async () => {
        await onDeviceManager.assertDeviceSwitcherState({ title: 'Connected' });
        await navigateToEjectWallets();
        await onSettings.ejectSingleWallet();

        await device.pressBack();
        await onTabBar.navigateToHome();

        await onDeviceManager.assertDeviceSwitcherState({ title: 'Connected' });
        await TrezorUserEnvLink.stopEmu();

        await onDeviceManager.assertDeviceSwitcherState({ title: 'Hi there!' });
    });

    it('Auto eject settings toggle switch', async () => {
        await onDeviceManager.assertDeviceSwitcherState({ title: 'Connected' });
        await navigateToEjectWallets();

        await onSettings.toggleAutoEject();
        await onAlertSheet.tapPrimaryButton();
        await TrezorUserEnvLink.stopEmu();

        await onDeviceManager.assertDeviceSwitcherState({ title: 'Hi there!' });
    });
});
