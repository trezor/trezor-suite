import { expect as detoxExpect } from 'detox';

import { conditionalDescribe } from '@suite-common/test-utils';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { onAlertSheet } from '../pageObjects/alertSheetActions';
import { onCoinEnabling } from '../pageObjects/coinEnablingActions';
import { onOnboarding } from '../pageObjects/onboardingActions';
import { onSettings } from '../pageObjects/settingsActions';
import { onTabBar } from '../pageObjects/tabBarActions';
import {
    appIsFullyLoaded,
    disconnectTrezorUserEnv,
    openApp,
    prepareTrezorEmulator,
    restartApp,
    wait,
} from '../utils';

conditionalDescribe(
    device.getPlatform() === 'android',
    'App Settings - with device interactions',
    () => {
        beforeAll(async () => {
            await prepareTrezorEmulator();
            await openApp({ newInstance: true });
            await onOnboarding.skipOnboarding();

            await onCoinEnabling.waitForInitScreen();
            await onCoinEnabling.toggleNetwork('btc');
            await onCoinEnabling.clickOnConfirmButton();
            await onAlertSheet.skipViewOnlyMode();
            await detoxExpect(element(by.id('@home/portfolio/header'))).toExist();
            await detoxExpect(element(by.text('Ethereum'))).not.toExist(); // ETH should not be enabled at this point
        });

        beforeEach(async () => {
            await restartApp();
            await appIsFullyLoaded();
            await wait(5000); // wait for trezor device to start communicating with the app
        });

        afterAll(async () => {
            await device.terminateApp();
            await disconnectTrezorUserEnv();
        });

        it('Coin Enabling', async () => {
            await onTabBar.navigateToSettings();
            await onSettings.tapCoinEnabling();
            await onCoinEnabling.toggleNetwork('eth');

            await device.pressBack();
            await device.pressBack();

            const ethereumTextElement = element(by.text('Ethereum'));

            await detoxExpect(ethereumTextElement).toExist();

            await onTabBar.navigateToSettings();
            await onSettings.tapCoinEnabling();
            await onCoinEnabling.toggleNetwork('eth');
            await device.pressBack();
            await device.pressBack();

            await detoxExpect(ethereumTextElement).not.toExist();
        });

        it('View Only Mode', async () => {
            await waitFor(
                element(
                    by.id('@device-manager/device-switch').withDescendant(by.text('Connected')),
                ),
            )
                .toBeVisible()
                .withTimeout(10000);

            await onTabBar.navigateToSettings();
            await onSettings.tapViewOnly();
            await onSettings.toggleWalletViewOnly();

            await TrezorUserEnvLink.stopBridge();

            await waitFor(
                element(
                    by.id('@device-manager/device-switch').withDescendant(by.text('Disconnected')),
                ),
            )
                .toBeVisible()
                .withTimeout(10000);

            await TrezorUserEnvLink.startBridge();
            await restartApp();

            await waitFor(
                element(
                    by.id('@device-manager/device-switch').withDescendant(by.text('Connected')),
                ),
            )
                .toBeVisible()
                .withTimeout(10000);

            await onTabBar.navigateToSettings();
            await onSettings.tapViewOnly();
            await onSettings.toggleWalletViewOnly();

            await device.pressBack();
            await device.pressBack();

            await TrezorUserEnvLink.stopBridge();

            await waitFor(
                element(
                    by.id('@device-manager/device-switch').withDescendant(by.text('Hi there!')),
                ),
            )
                .toBeVisible()
                .withTimeout(10000);

            await detoxExpect(element(by.text('Ethereum'))).not.toExist();
        });
    },
);
