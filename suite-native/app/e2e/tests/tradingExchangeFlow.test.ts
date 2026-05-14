import { MNEMONICS } from '@trezor/trezor-user-env-link';

import { ethCoinEnabled } from '../fixtures/ethCoinEnabled';
import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { portfolioTrackerBtcAccountState } from '../fixtures/portfolioTrackerBtcAccountState';
import { onDeviceConnecting } from '../pageObjects/deviceConnectingActions';
import { onHome } from '../pageObjects/homeActions';
import { onPassphrase } from '../pageObjects/passphraseModule';
import { onTabBar } from '../pageObjects/tabBarActions';
import { exchangePreviewActions } from '../pageObjects/trading/exchangePreviewActions';
import { exchangeOutputsReviewActions } from '../pageObjects/trading/outputsReviewActions';
import { tradingExchangeActions } from '../pageObjects/trading/tradingExchangeActions';
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
            await tradingExchangeActions.tapTradingSectionHeaderTab();
        });

        it('should display info card', async () => {
            await tradingExchangeActions.expectPortfolioTrackerInfoCard();
        });
    });

    describe('with device disconnected [@T3T1]', () => {
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
            await openApp({ args: { preloadedState: preloadedStateWithTrezor } });
            await waitForVisible(by.text('Connected'));
            await onPassphrase.openPassphraseWallet(passphrase);
            await onHome.waitForScreen();
            await onDeviceConnecting.stopEmuAndConfirmViewOnlyWarning();
            await tradingExchangeActions.openForm();
        });

        it('should request trezor connect before preview', async () => {
            await tradingExchangeActions.selectSendAsset('USDC');
            await tradingExchangeActions.selectReceiveAsset('USDT', 'Ethereum');
            await tradingExchangeActions.selectReceiveAccount('Ethereum #1');
            await tradingExchangeActions.setSendCryptoAmount('10');

            await tradingExchangeActions.viewHowTradingWorks();
            await tradingExchangeActions.expectValidExchangeForm();

            await tradingExchangeActions.confirmTradingForm();

            await exchangeOutputsReviewActions.expectConnectTrezorInfo();
            await exchangeOutputsReviewActions.cancelConnectTrezorInfo();

            await tradingExchangeActions.waitForTradeDataToLoad();
        });
    });

    describe('with device connected [@T3T1]', () => {
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
            await openApp({ args: { preloadedState: preloadedStateWithTrezor } });
            await waitForVisible(by.text('Connected'));
            await onPassphrase.openPassphraseWallet(passphrase);
            await tradingExchangeActions.openForm();
        });

        it('Basic exchange USDC to USDT', async () => {
            await tradingExchangeActions.selectSendAsset('USDC');
            await tradingExchangeActions.selectReceiveAsset('USDT', 'Ethereum');
            await tradingExchangeActions.selectReceiveAccount('Ethereum #1');
            await tradingExchangeActions.setSendCryptoAmount('10');

            await tradingExchangeActions.viewHowTradingWorks();
            await tradingExchangeActions.viewProviders();
            await tradingExchangeActions.expectValidExchangeForm();

            await tradingExchangeActions.confirmTradingForm();

            await exchangePreviewActions.expectExchangePreviewScreenToBeVisible();

            await exchangePreviewActions.waitForFeesToLoad();
            await exchangePreviewActions.scrollScreenToBottom();
            await exchangePreviewActions.goToTransactionSigning();

            await exchangeOutputsReviewActions.expectOutputsReviewScreenToBeVisible();
            await exchangeOutputsReviewActions.expectAndConfirmRecipientAddress();
            await exchangeOutputsReviewActions.expectAndConfirmTotalFee();
            await exchangeOutputsReviewActions.signTransaction();
            await exchangeOutputsReviewActions.expectSendTransactionButton();
            await exchangeOutputsReviewActions.cancelTransaction();

            await tradingExchangeActions.waitForTradeDataToLoad();
        });
    });
});
