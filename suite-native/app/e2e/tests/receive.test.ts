import { conditionalDescribe } from '@suite-common/test-utils';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { btcDiscoveryFinishedState } from '../fixtures/btcDiscoveryFinishedState';
import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { onAccountDetail } from '../pageObjects/accountDetailActions';
import { onAccountReceive } from '../pageObjects/accountReceiveActions';
import { onHome } from '../pageObjects/homeActions';
import { onMyAssets } from '../pageObjects/myAssetsActions';
import { onTabBar } from '../pageObjects/tabBarActions';
import {
    disconnectTrezorUserEnv,
    openApp,
    preparePreloadedReduxState,
    prepareTrezorEmulator,
    restartApp,
} from '../utils';

const preloadedState = preparePreloadedReduxState(
    onboardingCompletedState,
    btcDiscoveryFinishedState,
);

conditionalDescribe(device.getPlatform() === 'android', 'Receive', () => {
    beforeAll(async () => {
        await openApp({
            newInstance: true,
            args: { preloadedState },
        });
        await prepareTrezorEmulator();
        await restartApp();
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
