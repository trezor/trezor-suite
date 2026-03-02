import { expect as detoxExpect } from 'detox';

import { Model, TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { btcDiscoveryFinishedStateT3T1 } from '../fixtures/btcDiscoveryFinishedStateT3T1';
import { btcDiscoveryFinishedStateT3W1 } from '../fixtures/btcDiscoveryFinishedStateT3W1';
import { deviceChecksDisabledState } from '../fixtures/deviceChecksDisabledState';
import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { onAccountDetail } from '../pageObjects/accountDetailActions';
import { onAccountReceive } from '../pageObjects/accountReceiveActions';
import { onDeviceManager } from '../pageObjects/deviceManagerActions';
import { onMyAssets } from '../pageObjects/myAssetsActions';
import { onSettings } from '../pageObjects/settingsActions';
import { onTabBar } from '../pageObjects/tabBarActions';
import { openApp, preparePreloadedReduxState, prepareTrezorEmulator } from '../support/setup';
import { getModelFromEnv, waitToHaveText } from '../support/utils';

const MNEMONIC = 'ugly rally dial movie exhibit annual bean slender illegal frown giraffe scare';
// These labels were set manually on this seed
const ACCOUNT_LABEL = 'Evolu synced BTC account';
const WALLET_LABEL = 'Evolu synced wallet';
const ADDRESS_LABEL = 'Evolu synced BTC address';

const preloadedState = preparePreloadedReduxState(
    onboardingCompletedState,
    getModelFromEnv() === Model.T3W1
        ? btcDiscoveryFinishedStateT3W1
        : btcDiscoveryFinishedStateT3T1,
    deviceChecksDisabledState,
);

describe('Suite Sync [@androidOnly @smoke @T3T1 @T3W1]', () => {
    beforeEach(async () => {
        await openApp({ args: { preloadedState } });
        await prepareTrezorEmulator({ version: '2-main', seed: MNEMONIC });
        await onDeviceManager.assertDeviceSwitcherState({ title: 'Connected' });
        await onTabBar.navigateToSettings();
        await onSettings.enableSuiteSync();
        await onTabBar.tapBackButton();
    });

    // Automation is being reworked, skipping for now
    test.skip('Sync account label across sessions', async () => {
        // Verify account label sync
        await onTabBar.navigateToMyAssets();
        await waitToHaveText(by.id('@accountList/item/title'), ACCOUNT_LABEL);

        // Verify wallet label sync
        await onDeviceManager.tapDeviceSwitch();
        await detoxExpect(element(by.id('@wallet/label'))).toHaveText(WALLET_LABEL);
        await element(by.id('@wallet/label')).tap();

        // Verify address label sync
        await onMyAssets.openAccountDetail({ accountName: ACCOUNT_LABEL });
        await onAccountDetail.openReceive();
        await onAccountReceive.waitForScreen();
        await onAccountReceive.tapShowAddressButton();
        await TrezorUserEnvLink.pressYes();
        await onAccountReceive.verifyReceiveAddressLabel(ADDRESS_LABEL);
    });
});
