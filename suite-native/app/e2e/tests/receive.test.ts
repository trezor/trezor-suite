import { Model, TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { btcDiscoveryFinishedStateT3T1 } from '../fixtures/btcDiscoveryFinishedStateT3T1';
import { btcDiscoveryFinishedStateT3W1 } from '../fixtures/btcDiscoveryFinishedStateT3W1';
import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { onAccountDetail } from '../pageObjects/accountDetailActions';
import { onAccountReceive } from '../pageObjects/accountReceiveActions';
import { onHome } from '../pageObjects/homeActions';
import { onMyAssets } from '../pageObjects/myAssetsActions';
import { onTabBar } from '../pageObjects/tabBarActions';
import { openApp, preparePreloadedReduxState, prepareTrezorEmulator } from '../support/setup';
import { getModelFromEnv } from '../support/utils';

const preloadedState = preparePreloadedReduxState(
    onboardingCompletedState,
    getModelFromEnv() === Model.T3W1
        ? btcDiscoveryFinishedStateT3W1
        : btcDiscoveryFinishedStateT3T1,
);

describe('Receive [@androidOnly @smoke @T3T1 @T3W1]', () => {
    beforeEach(async () => {
        await openApp({ args: { preloadedState } });
        await prepareTrezorEmulator();
    });

    it('Generate device confirmed receive address.', async () => {
        await onHome.waitForScreen();
        await onTabBar.navigateToMyAssets();

        await onMyAssets.openAccountDetail({ accountName: 'Bitcoin #1' });

        await onAccountDetail.openReceive();
        await onAccountReceive.waitForScreen();

        await onAccountReceive.tapShowAddressButton();
        await TrezorUserEnvLink.pressYes();
        await onAccountReceive.verifyReceiveAddress('bc1qs9alwrln4e28se4tq2nc8dnnvskg83qexuj7s9');
    });
});
