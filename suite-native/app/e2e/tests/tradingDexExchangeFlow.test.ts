import { MNEMONICS } from '@trezor/trezor-user-env-link';

import { ethCoinEnabled } from '../fixtures/ethCoinEnabled';
import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { onPassphrase } from '../pageObjects/passphraseModule';
import {
    exchangeApprovalActions,
    exchangeRevokeActions,
} from '../pageObjects/trading/exchangeApprovalActions';
import { exchangeOutputsReviewActions } from '../pageObjects/trading/outputsReviewActions';
import { tradingExchangeActions } from '../pageObjects/trading/tradingExchangeActions';
import { openApp, preparePreloadedReduxState, prepareTrezorEmulator } from '../support/setup';
import { waitForVisible } from '../support/utils';

const preloadedStateWithEthereum = preparePreloadedReduxState(
    ethCoinEnabled,
    onboardingCompletedState,
);

const passphrase = process.env.TRADING_ACADEMIC_SEED_WALLET_PASSPHRASE;
const dexProviderName = 'LI.FI';

const prepareDexExchangeForm = async () => {
    await tradingExchangeActions.selectSendAsset('USDC', 'Ethereum', 'USD Coin');
    await tradingExchangeActions.selectReceiveAsset('USDT', 'Ethereum', 'Tether');
    await tradingExchangeActions.setSendCryptoAmount('6');
    await tradingExchangeActions.selectProvider(dexProviderName, 'dex');
    await tradingExchangeActions.expectValidExchangeForm();
};

const signApprovalTransactionWithoutSending = async () => {
    await exchangeOutputsReviewActions.expectOutputsReviewScreenToBeVisible();
    await exchangeOutputsReviewActions.expectAndConfirmTokenApproval();
    await exchangeOutputsReviewActions.expectAndConfirmApprovalTotalFee();
    await exchangeOutputsReviewActions.signTransaction();
    await exchangeOutputsReviewActions.expectSendTransactionButton();
    await exchangeOutputsReviewActions.cancelTransaction();
};

const signRevokeTransactionWithoutSending = async () => {
    await exchangeOutputsReviewActions.expectOutputsReviewScreenToBeVisible();
    await exchangeOutputsReviewActions.expectAndConfirmTokenRevocation();
    await exchangeOutputsReviewActions.expectAndConfirmApprovalTotalFee();
    await exchangeOutputsReviewActions.signTransaction();
    await exchangeOutputsReviewActions.expectSendTransactionButton();
    await exchangeOutputsReviewActions.cancelTransaction();
};

describe('Trade Exchange DEX [@androidOnly @T3T1]', () => {
    beforeAll(() => {
        if (!passphrase) {
            throw new Error(
                'TRADING_ACADEMIC_SEED_WALLET_PASSPHRASE environment variable is required',
            );
        }
    });

    beforeEach(async () => {
        await prepareTrezorEmulator({
            seed: MNEMONICS.mnemonic_academic,
            passphrase_protection: true,
        });
        await openApp({ args: { preloadedState: preloadedStateWithEthereum } });
        await waitForVisible(by.text('Connected'));
        await onPassphrase.openPassphraseWallet(passphrase!);
        await tradingExchangeActions.openForm();
    });

    it('signs approval transaction for DEX quote requiring allowance and stops before sending', async () => {
        await prepareDexExchangeForm();
        await tradingExchangeActions.expectValidExchangeForm();
        await tradingExchangeActions.confirmTradingForm();

        await exchangeApprovalActions.expectScreenToBeVisible();
        await exchangeApprovalActions.waitForFeesToLoad();
        await exchangeApprovalActions.goToOutputsReview();

        await signApprovalTransactionWithoutSending();
    });

    it('signs revoke transaction for DEX quote with existing allowance and stops before sending', async () => {
        await prepareDexExchangeForm();
        try {
            await tradingExchangeActions.revokeApproval();
        } catch (error) {
            throw new Error(
                'DEX revoke flow prerequisite is missing an existing approval, revoke button not shown',
                {
                    cause: error,
                },
            );
        }

        await exchangeRevokeActions.expectScreenToBeVisible();
        await exchangeRevokeActions.waitForFeesToLoad();
        await exchangeRevokeActions.goToOutputsReview();

        await signRevokeTransactionWithoutSending();
    });
});
