import { expect as detoxExpect } from 'detox';
import { diff } from 'jest-diff';
import { isEqual, omit } from 'lodash';

import {
    BaseEvoluClient,
    accountSeed,
    buildExpectedAccount,
    buildExpectedAddress,
    buildExpectedOutput,
    checkEvoluRelayServerRunning,
    createAddressSeed,
    outputSeed,
    ownerSecret,
    seedQuotaManagerData,
    walletSeed,
    wipeAndRestartEvoluRelayServer,
} from '@suite-common/e2e-evolu-client';
import { Model, TrezorUserEnvLink } from '@trezor/trezor-user-env-link';
import { scheduleAction } from '@trezor/utils';

import { btcDiscoveryFinishedStateT3T1 } from '../fixtures/btcDiscoveryFinishedStateT3T1';
import { btcDiscoveryFinishedStateT3W1 } from '../fixtures/btcDiscoveryFinishedStateT3W1';
import { deviceChecksDisabledState } from '../fixtures/deviceChecksDisabledState';
import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { onAccountDetail } from '../pageObjects/accountDetailActions';
import { onAccountDetailSettings } from '../pageObjects/accountDetailSettingsActions';
import { onAccountReceive } from '../pageObjects/accountReceiveActions';
import { onDeviceManager } from '../pageObjects/deviceManagerActions';
import { onMyAssets } from '../pageObjects/myAssetsActions';
import { onSettings } from '../pageObjects/settingsActions';
import { onTabBar } from '../pageObjects/tabBarActions';
import { openApp, preparePreloadedReduxState, prepareTrezorEmulator } from '../support/setup';
import {
    getModelFromEnv,
    scrollUntilVisible,
    waitForVisible,
    waitToHaveText,
} from '../support/utils';

type TableName = Parameters<BaseEvoluClient['readFrom']>[0];

class NativeEvoluClient extends BaseEvoluClient {
    async expectInTable<T extends TableName>(
        table: T,
        expectedData: Record<string, unknown>[],
        options?: { omit?: string[]; timeout?: number },
    ) {
        const omitFields = options?.omit ?? ['createdAt']; //'id',
        const timeout = options?.timeout ?? 10_000;

        let lastError: Error | undefined;

        await scheduleAction(
            async () => {
                const actualData = await this.readFrom(table);
                const actualOmitted = actualData.map(item => omit(item, omitFields));

                if (!isEqual(expectedData, actualOmitted)) {
                    lastError = new Error(
                        `Table "${table}" data does not match.\nDiff:\n${diff(expectedData, actualOmitted)}`,
                    );
                    throw lastError;
                }
            },
            { deadline: Date.now() + timeout, gap: 500 },
        ).catch(e => {
            throw lastError ?? e;
        });
    }
}

const FIRST_BTC_RECEIVE_ADDRESS = 'bc1q7ceqvaq7fqyywxqcx7qnfxkfk2ykpsla9pe80q';
const addressSeed = createAddressSeed(FIRST_BTC_RECEIVE_ADDRESS);

const preloadedState = preparePreloadedReduxState(
    onboardingCompletedState,
    getModelFromEnv() === Model.T3W1
        ? btcDiscoveryFinishedStateT3W1
        : btcDiscoveryFinishedStateT3T1,
    deviceChecksDisabledState,
);

describe('Suite Sync - Labelling [@androidOnly @T3T1 @smoke]', () => {
    let evoluClient: NativeEvoluClient;

    beforeEach(async () => {
        await checkEvoluRelayServerRunning();
        wipeAndRestartEvoluRelayServer();

        evoluClient = new NativeEvoluClient();

        await openApp({ args: { preloadedState } });
        await prepareTrezorEmulator({ seed: 'mnemonic_12' });
        await onDeviceManager.assertDeviceSwitcherState({ title: 'Connected' });
    });

    test.skip('Create new labels', async () => {
        const ACCOUNT_LABEL = 'Evolu write BTC account';
        const ADDRESS_LABEL = 'Evolu write BTC address';
        const OUTPUT_LABEL = 'Evolu write BTC output';
        const TX_ID = 'aa545d95cf07892e1ae70b40e856b9b476f703e2e20647d0985830fd7b734393';
        const expectedAccountData = buildExpectedAccount({ label: ACCOUNT_LABEL });
        const expectedAddressData = buildExpectedAddress({
            address: FIRST_BTC_RECEIVE_ADDRESS,
            label: ADDRESS_LABEL,
        });
        const expectedOutputData = buildExpectedOutput({
            txId: TX_ID,
            outputIndex: '0',
            label: OUTPUT_LABEL,
        });

        await onTabBar.navigateToSettings();
        await onSettings.enableSuiteSync();
        await onTabBar.tapBackButton();

        // Change account label
        await onTabBar.navigateToMyAssets();
        await onMyAssets.openAccountDetail({ accountName: 'Bitcoin #1' });
        const firstBtcAccountLabel = element(by.text('Bitcoin #1')).atIndex(0);
        await waitForVisible(firstBtcAccountLabel);
        await firstBtcAccountLabel.tap();
        await detoxExpect(element(by.id('@screen/AccountDetail'))).toBeVisible();

        await onAccountDetail.openSettings();
        await onAccountDetailSettings.renameAccount({ newAccountName: ACCOUNT_LABEL });
        await onTabBar.tapBackButton();

        // Change address label
        await onAccountDetail.openReceive();
        await onAccountReceive.tapShowAddressButton();
        await TrezorUserEnvLink.pressYes();
        await element(by.id('@receive/address-label')).tap();
        await element(by.id('@label-edit-form/input')).replaceText(ADDRESS_LABEL);
        await element(by.id('@label-edit-form/confirm-button')).tap();

        // Change output label
        await onTabBar.tapBackButton();
        const transaction = element(by.id(`@transactions/item/${TX_ID}`));

        await scrollUntilVisible(transaction);
        await transaction.tap();

        const outputLabelButton = element(by.id(`@transactions/output-label/${TX_ID}/0/button`));

        await waitForVisible(outputLabelButton);
        await outputLabelButton.tap();
        await element(by.id('@label-edit-form/input')).replaceText(OUTPUT_LABEL);
        await element(by.id('@label-edit-form/confirm-button')).tap();

        // Verify labels were synced to the relay
        evoluClient.init({ ownerSecret });
        await evoluClient.expectInTable('account', [expectedAccountData]);
        await evoluClient.expectInTable('address', [expectedAddressData]);
        await evoluClient.expectInTable('output', [expectedOutputData]);
    });

    test('Sync labels from relay', async () => {
        // Seed the relay before enabling SuiteSync so the labels are ready to sync on connect.
        evoluClient.init({ ownerSecret });
        evoluClient.writeTo('wallet', walletSeed);
        evoluClient.writeTo('account', accountSeed);
        evoluClient.writeTo('address', addressSeed);
        evoluClient.writeTo('output', outputSeed);
        seedQuotaManagerData();

        await onTabBar.navigateToSettings();
        await onSettings.enableSuiteSync();
        await onTabBar.tapBackButton();

        // Wait for account label to sync and appear in the account list
        await onTabBar.navigateToMyAssets();
        const firstAccountTitle = element(by.id('@accountList/item/title')).atIndex(0);
        await waitToHaveText(firstAccountTitle, accountSeed.label, { timeout: 30_000 });

        // Wait for wallet label to sync and appear in the device switcher
        await onDeviceManager.tapDeviceSwitch();
        await waitToHaveText(by.id('@wallet/label'), walletSeed.label);
        await element(by.id('@wallet/label')).tap();

        // Verify address label synced
        await onMyAssets.openAccountDetail({ accountName: accountSeed.label });
        await onAccountDetail.openReceive();
        await onAccountReceive.tapShowAddressButton();
        await TrezorUserEnvLink.pressYes();
        await onAccountReceive.verifyReceiveAddressLabel(addressSeed.label);

        // Verify output label synced
        await onTabBar.tapBackButton();
        await onAccountDetail.waitForScreen();
        const transaction = element(by.id(`@transactions/item/${outputSeed.txId}`));
        // Detail page has area that cannot be dragged
        await scrollUntilVisible(transaction, { startPositionY: 0.8 });
        await transaction.tap();
        const outputLabel = element(by.id(`@transactions/output-label/${outputSeed.txId}/0/text`));
        await waitToHaveText(outputLabel, outputSeed.label);
    });
});
