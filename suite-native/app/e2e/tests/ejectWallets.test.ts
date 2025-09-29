import { conditionalDescribe } from '@suite-common/test-utils';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { regtestDiscoveryFinishedStateT3T1 } from '../fixtures/regtestDiscoveryFinishedStateT3T1';
import { onAlertSheet } from '../pageObjects/alertSheetActions';
import { onDeviceManager } from '../pageObjects/deviceManagerActions';
import { onSettings } from '../pageObjects/settingsActions';
import { onTabBar } from '../pageObjects/tabBarActions';
import {
    appIsFullyLoaded,
    disconnectTrezorUserEnv,
    openApp,
    preparePreloadedReduxState,
    prepareTrezorEmulator,
    restartApp,
    wipeAppData,
} from '../utils';

const preloadedState = preparePreloadedReduxState(
    onboardingCompletedState,
    regtestDiscoveryFinishedStateT3T1,
);

const navigateToEjectWallets = async () => {
    await onTabBar.navigateToSettings();
    await onSettings.tapEjectWallets();
};

conditionalDescribe(device.getPlatform() === 'android', 'Eject wallets', () => {
    beforeEach(async () => {
        await openApp({
            newInstance: true,
            args: {
                preloadedState,
            },
        });
        await appIsFullyLoaded();
        await prepareTrezorEmulator();
        await restartApp();
    });

    afterEach(async () => {
        await wipeAppData();
        await disconnectTrezorUserEnv();
    });

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
