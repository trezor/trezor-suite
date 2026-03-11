import { expect as jestExpect } from '@jest/globals';
import { expect as detoxExpect } from 'detox';

import { Model, TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { regtestDiscoveryFinishedStateT3T1 } from '../fixtures/regtestDiscoveryFinishedStateT3T1';
import { regtestDiscoveryFinishedStateT3W1 } from '../fixtures/regtestDiscoveryFinishedStateT3W1';
import { onDeviceManager } from '../pageObjects/deviceManagerActions';
import { onPassphrase } from '../pageObjects/passphraseModule';
import { openApp, preparePreloadedReduxState, prepareTrezorEmulator } from '../support/setup';
import { getModelFromEnv, wait } from '../support/utils';

const INITIAL_ACCOUNT_BALANCE = 3.14;

const enterPassphraseFlow = async (passphrase: string) => {
    await onPassphrase.expectEnterPassphraseScreen();
    await onPassphrase.enterPassphrase(passphrase);

    await onPassphrase.expectConfirmPassphraseOnDeviceRequest();
    await onPassphrase.confirmPassphraseOnEmu();
};

const emptyPassphraseFlow = async (passphrase: string) => {
    await onPassphrase.expectEmptyPassphraseWalletScreen();
    await onPassphrase.openEmptyPassphraseWalletAndConfirmBestPractices();

    await onPassphrase.expectEmptyPassphraseWalletConfirmationScreen();
    await onPassphrase.enterPassphrase(passphrase);

    await onPassphrase.expectConfirmPassphraseOnDeviceRequest();
    await onPassphrase.confirmPassphraseOnEmu();
};

const expectEmptyWallet = async () => {
    await onPassphrase.expectSwitcherSubheader('Passphrase wallet #1');

    await detoxExpect(element(by.id('@assets/cryptoAmount/regtest'))).toHaveText('0 BTC REGTEST');
};

const expectNonEmptyWallet = async () => {
    await onPassphrase.expectSwitcherSubheader('Passphrase wallet #1');

    const amountEl = element(by.id('@assets/cryptoAmount/regtest'));
    const { text } = (await amountEl.getAttributes()) as { text: string };

    jestExpect(text).not.toBe('0 BTC REGTEST');
    jestExpect(text).toMatch(/[0-9.]+ BTC REGTEST/);
};

const preloadedState = preparePreloadedReduxState(
    onboardingCompletedState,
    getModelFromEnv() === Model.T3T1
        ? regtestDiscoveryFinishedStateT3T1
        : regtestDiscoveryFinishedStateT3W1,
);

describe('passphrase flow [@androidOnly @smoke @T3T1 @T3W1]', () => {
    beforeAll(async () => {
        // wallet without passphrase
        await TrezorUserEnvLink.sendToAddressAndMineBlock({
            address: 'bcrt1q34up3cga3fkmph47t22mpk5d0xxj3ppghph9da',
            btc_amount: INITIAL_ACCOUNT_BALANCE,
        });

        // `E2E:existing wallet` passphrase
        await TrezorUserEnvLink.sendToAddressAndMineBlock({
            address: 'bcrt1qgxgjkuym9e0uzmxl7nhvv6a8pxxd63hdw5c70j',
            btc_amount: INITIAL_ACCOUNT_BALANCE,
        });
    });

    // TODO #16495 - currently not working
    describe.skip('with passphrase not allowed on Trezor', () => {
        beforeEach(async () => {
            await openApp({ args: { preloadedState } });
            await prepareTrezorEmulator({ passphrase_protection: true });
            await onDeviceManager.assertDeviceSwitcherState({ title: 'Connected' });
        });

        it('Open empty passphrase wallet', async () => {
            const passphrase = 'E2E:empty wallet';
            await onPassphrase.openNewPassphraseFlow();
            await enterPassphraseFlow(passphrase);
            await emptyPassphraseFlow(passphrase);
            await expectEmptyWallet();
        });

        it('Open passphrase wallet with funds', async () => {
            const passphrase = 'E2E:existing wallet';
            await onPassphrase.openNewPassphraseFlow();
            await enterPassphraseFlow(passphrase);
            await expectNonEmptyWallet();
        });

        it('close passphrase flow', async () => {
            await onPassphrase.openNewPassphraseFlow();
            await onPassphrase.closePassphraseFlow();
            await wait(1000);
            await detoxExpect(element(by.id('@screen/PassphraseForm'))).not.toExist();
        });
    });

    describe('with passphrase already allowed on Trezor', () => {
        beforeEach(async () => {
            await openApp({ args: { preloadedState } });
            await prepareTrezorEmulator({ passphrase_protection: true });
        });

        it('Open empty passphrase wallet', async () => {
            const passphrase = 'E2E:empty wallet';
            await onPassphrase.openNewPassphraseFlow();
            await enterPassphraseFlow(passphrase);
            await emptyPassphraseFlow(passphrase);
            await expectEmptyWallet();
        });

        it('Open passphrase wallet with funds', async () => {
            const passphrase = 'E2E:existing wallet';
            await onPassphrase.openNewPassphraseFlow();
            await enterPassphraseFlow(passphrase);
            await expectNonEmptyWallet();
        });

        it('close passphrase flow', async () => {
            await onPassphrase.openNewPassphraseFlow();
            await onPassphrase.closePassphraseFlow();
            await wait(5000);
            await detoxExpect(element(by.id('@screen/PassphraseForm'))).not.toExist();
        });
    });
});
