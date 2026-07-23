import { Model } from '@trezor/trezor-user-env-link';

import { btcDiscoveryFinishedStateT3T1 } from '../fixtures/btcDiscoveryFinishedStateT3T1';
import { btcDiscoveryFinishedStateT3W1 } from '../fixtures/btcDiscoveryFinishedStateT3W1';
import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { onAccountDetail } from '../pageObjects/accountDetailActions';
import { onAccountReceive } from '../pageObjects/accountReceiveActions';
import { onDeviceManager } from '../pageObjects/deviceManagerActions';
import { onHome } from '../pageObjects/homeActions';
import { onMyAssets } from '../pageObjects/myAssetsActions';
import { onTabBar } from '../pageObjects/tabBarActions';
import { openApp, preparePreloadedReduxState, prepareTrezorEmulator } from '../support/setup';
import { getModelFromEnv } from '../support/utils';

const model = getModelFromEnv();
const preloadedState = preparePreloadedReduxState(
    onboardingCompletedState,
    model === Model.T3W1 ? btcDiscoveryFinishedStateT3W1 : btcDiscoveryFinishedStateT3T1,
);
const expectedReceiveAddress =
    model === Model.T3W1 ? 'bc1q czeu ... xlma n6' : 'bc1q s9al ... xuj7 s9';

describe('Receive [@androidOnly @T3T1 @T3W1]', () => {
    beforeEach(async () => {
        await prepareTrezorEmulator();
        await openApp({ args: { preloadedState } });
        await onDeviceManager.assertDeviceSwitcherState({ title: 'Connected' });
    });

    it('Displays the receive address without device confirmation.', async () => {
        await onHome.waitForScreen();
        await onTabBar.navigateToMyAssets();

        await onMyAssets.openAccountDetail({ accountName: 'Bitcoin #1' });

        await onAccountDetail.openReceive();
        await onAccountReceive.waitForScreen();

        await onAccountReceive.verifyReceiveAddress(expectedReceiveAddress);
    });
});
