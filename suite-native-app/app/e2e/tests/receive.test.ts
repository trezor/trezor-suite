import { Model, TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { regtestDiscoveryFinishedStateT3T1 } from '../fixtures/regtestDiscoveryFinishedStateT3T1';
import { regtestDiscoveryFinishedStateT3W1 } from '../fixtures/regtestDiscoveryFinishedStateT3W1';
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
    model === Model.T3W1 ? regtestDiscoveryFinishedStateT3W1 : regtestDiscoveryFinishedStateT3T1,
);
const expectedReceiveAddress = 'bcrt 1qxc xh4q h3a7 3myv txfq dhv5 5n8m et98 rscd fva6';

describe('Receive [@androidOnly @T3T1 @T3W1]', () => {
    beforeAll(async () => {
        await TrezorUserEnvLink.sendToAddressAndMineBlock({
            address: 'bcrt1q34up3cga3fkmph47t22mpk5d0xxj3ppghph9da',
            btc_amount: 3.14,
        });
    });

    beforeEach(async () => {
        await prepareTrezorEmulator();
        await openApp({ args: { preloadedState } });
        await onDeviceManager.assertDeviceSwitcherState({ title: 'Connected' });
    });

    it('Displays the receive address without device confirmation.', async () => {
        await onHome.waitForScreen();
        await onTabBar.navigateToMyAssets();

        await onMyAssets.openAccountDetail({ accountName: 'Bitcoin Regtest #1' });

        await onAccountDetail.openReceive();
        await onAccountReceive.waitForScreen();

        await onAccountReceive.verifyReceiveAddress(expectedReceiveAddress);
    });
});
