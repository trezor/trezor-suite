import { MNEMONICS } from '@trezor/trezor-user-env-link';

import { ethCoinEnabled } from '../fixtures/ethCoinEnabled';
import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { onPassphrase } from '../pageObjects/passphraseModule';
import {
    exchangeApprovalActions,
    exchangeRevokeActions,
} from '../pageObjects/trading/exchangeApprovalActions';
import { tradingExchangeActions } from '../pageObjects/trading/tradingExchangeActions';
import { exchangeTransactionReviewActions } from '../pageObjects/trading/transactionReviewActions';
import { DexRevokeTradingServer } from '../support/dexRevokeTradingServer';
import { openApp, preparePreloadedReduxState, prepareTrezorEmulator } from '../support/setup';
import { waitForVisible } from '../support/utils';

const preloadedStateWithEthereum = preparePreloadedReduxState(
    ethCoinEnabled,
    onboardingCompletedState,
);

const preloadedStateWithDexRevoke = preparePreloadedReduxState(
    ethCoinEnabled,
    onboardingCompletedState,
    { wallet: { trading: { tradingEnvironment: 'localhost' } } },
);

const dexRevokeServer = new DexRevokeTradingServer();
let isFixturePortReversed = false;
const passphrase = process.env.TRADING_ACADEMIC_SEED_WALLET_PASSPHRASE;
const dexProviderName = 'LI.FI';

const openDexExchangeForm = async (preloadedState: string) => {
    await openApp({ args: { preloadedState } });
    await waitForVisible(by.text('Connected'));
    await onPassphrase.openPassphraseWallet(passphrase!);
    await tradingExchangeActions.openForm();
};

const prepareDexExchangeForm = async () => {
    await tradingExchangeActions.selectSendAsset('USDC', 'Ethereum', 'USD Coin');
    await tradingExchangeActions.selectReceiveAsset('USDT', 'Ethereum', 'Tether');
    await tradingExchangeActions.setSendCryptoAmount('6');
    await tradingExchangeActions.selectProvider(dexProviderName, 'dex');
    await tradingExchangeActions.expectValidExchangeForm();
};

const signApprovalTransactionWithoutSending = async () => {
    await exchangeTransactionReviewActions.expectTrtansactionReviewScreenToBeVisible();
    await exchangeTransactionReviewActions.expectAndConfirmTokenApproval();
    await exchangeTransactionReviewActions.expectAndConfirmApprovalTotalFee();
    await exchangeTransactionReviewActions.signTransaction();
    await exchangeTransactionReviewActions.expectSendTransactionButton();
    await exchangeTransactionReviewActions.cancelTransaction();
};

const signRevokeTransactionWithoutSending = async () => {
    await exchangeTransactionReviewActions.expectTrtansactionReviewScreenToBeVisible();
    await exchangeTransactionReviewActions.expectAndConfirmTokenRevocation();
    await exchangeTransactionReviewActions.expectAndConfirmApprovalTotalFee();
    await exchangeTransactionReviewActions.signTransaction();
    await exchangeTransactionReviewActions.expectSendTransactionButton();
    await exchangeTransactionReviewActions.cancelTransaction();
};

describe('Trade Exchange DEX [@androidOnly @T3T1]', () => {
    beforeAll(() => {
        if (!passphrase) {
            throw new Error(
                'TRADING_ACADEMIC_SEED_WALLET_PASSPHRASE environment variable is required',
            );
        }
    });

    afterAll(async () => {
        await dexRevokeServer.stop();
        if (isFixturePortReversed) {
            await device.unreverseTcpPort(dexRevokeServer.port);
        }
    });

    beforeEach(async () => {
        await prepareTrezorEmulator({
            seed: MNEMONICS.mnemonic_academic,
            passphrase_protection: true,
        });
    });

    it('signs approval transaction for DEX quote requiring allowance and stops before sending', async () => {
        await openDexExchangeForm(preloadedStateWithEthereum);
        await prepareDexExchangeForm();
        await tradingExchangeActions.expectValidExchangeForm();
        await tradingExchangeActions.confirmTradingForm();

        await exchangeApprovalActions.expectScreenToBeVisible();
        await exchangeApprovalActions.waitForFeesToLoad();
        await exchangeApprovalActions.goToOutputsReview();

        await signApprovalTransactionWithoutSending();
    });

    it('signs revoke transaction for DEX quote with existing allowance and stops before sending', async () => {
        await dexRevokeServer.start();
        await device.reverseTcpPort(dexRevokeServer.port);
        isFixturePortReversed = true;

        await openDexExchangeForm(preloadedStateWithDexRevoke);
        await prepareDexExchangeForm();
        await tradingExchangeActions.revokeApproval();

        await exchangeRevokeActions.expectScreenToBeVisible();
        await exchangeRevokeActions.waitForFeesToLoad();
        await exchangeRevokeActions.goToOutputsReview();

        await signRevokeTransactionWithoutSending();
    });
});
