import { MNEMONICS } from '@trezor/trezor-user-env-link';

import { ethCoinEnabled } from '../fixtures/ethCoinEnabled';
import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { portfolioTrackerBtcAccountState } from '../fixtures/portfolioTrackerBtcAccountState';
import { onDeviceConnecting } from '../pageObjects/deviceConnectingActions';
import { onHome } from '../pageObjects/homeActions';
import { onPassphrase } from '../pageObjects/passphraseModule';
import { onTabBar } from '../pageObjects/tabBarActions';
import { exchangePreviewActions } from '../pageObjects/trading/exchangePreviewActions';
import { tradingExchangeActions } from '../pageObjects/trading/tradingExchangeActions';
import { exchangeTransactionReviewActions } from '../pageObjects/trading/transactionReviewActions';
import { openApp, preparePreloadedReduxState, prepareTrezorEmulator } from '../support/setup';
import { waitForVisible } from '../support/utils';

const preloadedStateWithoutTrezor = preparePreloadedReduxState(
    portfolioTrackerBtcAccountState,
    onboardingCompletedState,
);

const preloadedStateWithTrezor = preparePreloadedReduxState(
    ethCoinEnabled,
    onboardingCompletedState,
);

const passphrase = process.env.TRADING_ACADEMIC_SEED_WALLET_PASSPHRASE;

describe('Trade Exchange [@androidOnly]', () => {
    describe('with portfolio tracker [@noDevice]', () => {
        beforeEach(async () => {
            await openApp({ args: { preloadedState: preloadedStateWithoutTrezor } });
            await onTabBar.navigateToTrade();
        });

        it('should display info card', async () => {
            await tradingExchangeActions.expectPortfolioTrackerInfoCard();
        });
    });

    // Skipping due to emulator crash
    describe('with device disconnected [@T3T1]', () => {
        beforeEach(async () => {
            if (!passphrase) {
                throw new Error(
                    'TRADING_ACADEMIC_SEED_WALLET_PASSPHRASE environment variable is required',
                );
            }
            await prepareTrezorEmulator({
                seed: MNEMONICS.mnemonic_academic,
                passphrase_protection: true,
            });
            await openApp({ args: { preloadedState: preloadedStateWithTrezor } });
            await waitForVisible(by.text('Connected'));
            await onPassphrase.openPassphraseWallet(passphrase);
            await onHome.waitForScreen();
            await onDeviceConnecting.stopEmuAndConfirmViewOnlyWarning();
            await tradingExchangeActions.openForm();
        });

        it('should request trezor connect before preview', async () => {
            await tradingExchangeActions.selectSendAsset('USDC', undefined, 'USD Coin');
            await tradingExchangeActions.selectReceiveAsset('USDT', 'Ethereum', 'Tether');
            await tradingExchangeActions.selectReceiveAccount('Ethereum #1');
            await tradingExchangeActions.setSendCryptoAmount('10');

            await tradingExchangeActions.viewHowTradingWorks();
            await tradingExchangeActions.expectValidExchangeForm();

            await tradingExchangeActions.confirmTradingForm();

            await exchangeTransactionReviewActions.expectConnectTrezorInfo();
            await exchangeTransactionReviewActions.cancelConnectTrezorInfo();

            await tradingExchangeActions.waitForTradeDataToLoad();
        });
    });

    // Skipping due to emulator crash
    describe('with device connected [@T3T1]', () => {
        beforeEach(async () => {
            if (!passphrase) {
                throw new Error(
                    'TRADING_ACADEMIC_SEED_WALLET_PASSPHRASE environment variable is required',
                );
            }
            await prepareTrezorEmulator({
                seed: MNEMONICS.mnemonic_academic,
                passphrase_protection: true,
            });
            await openApp({ args: { preloadedState: preloadedStateWithTrezor } });
            await waitForVisible(by.text('Connected'));
            await onPassphrase.openPassphraseWallet(passphrase);
            await tradingExchangeActions.openForm();
        });

        it('Basic exchange USDC to USDT', async () => {
            await tradingExchangeActions.selectSendAsset('USDC', undefined, 'USD Coin');
            await tradingExchangeActions.selectReceiveAsset('USDT', 'Ethereum', 'Tether');
            await tradingExchangeActions.selectReceiveAccount('Ethereum #1');
            await tradingExchangeActions.setSendCryptoAmount('10');

            await tradingExchangeActions.viewHowTradingWorks();
            await tradingExchangeActions.select1stCEXProvider();
            await tradingExchangeActions.expectValidExchangeForm();

            await tradingExchangeActions.confirmTradingForm();

            await exchangePreviewActions.expectExchangePreviewScreenToBeVisible();

            await exchangePreviewActions.waitForFeesToLoad();
            await exchangePreviewActions.scrollScreenToBottom();
            await exchangePreviewActions.goToTransactionSigning();

            await exchangeTransactionReviewActions.expectTrtansactionReviewScreenToBeVisible();
            await exchangeTransactionReviewActions.expectAndConfirmRecipientAddress();
            await exchangeTransactionReviewActions.expectAndConfirmTotalFee();
            await exchangeTransactionReviewActions.signTransaction();
            await exchangeTransactionReviewActions.expectSendTransactionButton();
            await exchangeTransactionReviewActions.cancelTransaction();

            await tradingExchangeActions.waitForTradeDataToLoad();
        });
    });
});
