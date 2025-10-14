import { conditionalDescribe } from '@suite-common/test-utils';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { btcDiscoveryFinishedStateT3T1 } from '../fixtures/btcDiscoveryFinishedStateT3T1';
import { btcDiscoveryFinishedStateT3W1 } from '../fixtures/btcDiscoveryFinishedStateT3W1';
import { deviceChecksDisabledState } from '../fixtures/deviceChecksDisabledState';
import { deviceChecksEnabledState } from '../fixtures/deviceChecksEnabledState';
import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { onAccountDetail } from '../pageObjects/accountDetailActions';
import { onAccountReceive } from '../pageObjects/accountReceiveActions';
import { onDeviceOnboarding } from '../pageObjects/deviceOnboardingActions';
import { onDevicePrompt } from '../pageObjects/devicePromptActions';
import { onHome } from '../pageObjects/homeActions';
import { onMyAssets } from '../pageObjects/myAssetsActions';
import { onTabBar } from '../pageObjects/tabBarActions';
import {
    disconnectTrezorUserEnv,
    getModelFromEnv,
    mergePreloadedReduxState,
    openApp,
    prepareTrezorEmulator,
    restartApp,
} from '../utils';

const preloadedState = mergePreloadedReduxState(
    onboardingCompletedState,
    getModelFromEnv() === 'T3W1' ? btcDiscoveryFinishedStateT3W1 : btcDiscoveryFinishedStateT3T1,
    getModelFromEnv() === 'T3W1' ? deviceChecksDisabledState : deviceChecksEnabledState, // skip device checks on T3W1 because we are using 2-main FW
);

conditionalDescribe(device.getPlatform() === 'android', 'Receive', () => {
    beforeAll(async () => {
        await openApp({
            newInstance: true,
            args: { preloadedState },
        });
        await prepareTrezorEmulator();
        await restartApp();
        if (getModelFromEnv() === 'T3W1') {
            await onDevicePrompt.allowConnectToTrezor();
            await onDeviceOnboarding.enterTHPPairingCode();
        }
    });

    afterAll(async () => {
        await disconnectTrezorUserEnv();
        await device.terminateApp();
    });

    it('Generate device confirmed receive address.', async () => {
        await onHome.waitForScreen();
        await onTabBar.navigateToMyAssets();

        await onMyAssets.openAccountDetail({ accountName: 'Bitcoin #1' });

        await onAccountDetail.openReceive();
        await onAccountReceive.waitForScreen();

        await onAccountReceive.tapShowAddressButton();
        await TrezorUserEnvLink.pressYes();
        await onAccountReceive.verifyReceiveAddress('32hQpu7yqoxbXfUw1oaBuojodzxxoKhKHB');
    });
});
