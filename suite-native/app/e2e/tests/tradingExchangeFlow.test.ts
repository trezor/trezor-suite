import { conditionalDescribe } from '@suite-common/test-utils';
import { MNEMONICS, TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { ethCoinEnabled } from '../fixtures/ethCoinEnabled';
import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { portfolioTrackerBtcAccountState } from '../fixtures/portfolioTrackerBtcAccountState';
import { onPassphrase } from '../pageObjects/passphraseModule';
import { onTabBar } from '../pageObjects/tabBarActions';
import { exchangePreviewActions } from '../pageObjects/trading/exchangePreviewActions';
import { outputsReviewActions } from '../pageObjects/trading/outputsReviewActions';
import { tradingExchangeActions } from '../pageObjects/trading/tradingExchangeActions';
import { tradingFeeActions } from '../pageObjects/trading/tradingFeeActions';
import { openApp, preparePreloadedReduxState, prepareTrezorEmulator } from '../utils';

const preloadedStateWithoutTrezor = preparePreloadedReduxState(
    portfolioTrackerBtcAccountState,
    onboardingCompletedState,
);

const preloadedStateWithTrezor = preparePreloadedReduxState(
    ethCoinEnabled,
    onboardingCompletedState,
);

const isCIRun = !!process.env.GITHUB_ACTION;
const passphrase = process.env.TRADING_ACADEMIC_SEED_WALLET_PASSPHRASE;

conditionalDescribe(device.getPlatform() === 'android', 'Trade Exchange', () => {
    describe('with portfolio tracker', () => {
        beforeEach(async () => {
            await openApp({
                newInstance: true,
                args: {
                    preloadedState: preloadedStateWithoutTrezor,
                },
                wipeData: true,
            });
            await onTabBar.navigateToTrade();
            await tradingExchangeActions.tapTradingSectionHeaderTab();
        });

        afterEach(async () => {
            await device.terminateApp();
        });

        it('should display info card', async () => {
            await tradingExchangeActions.expectPortfolioTrackerInfoCard();
        });
    });

    conditionalDescribe(isCIRun || passphrase, 'with device connected', () => {
        const openSwapForm = async () => {
            await onTabBar.navigateToTrade();
            await tradingExchangeActions.tapTradingSectionHeaderTab();
            await tradingExchangeActions.waitForTradeDataToLoad();
        };

        beforeAll(() => {
            if (!passphrase) {
                throw new Error(
                    'TRADING_ACADEMIC_SEED_WALLET_PASSPHRASE environment variable is required',
                );
            }
        });

        beforeEach(async () => {
            await openApp({
                newInstance: true,
                args: {
                    preloadedState: preloadedStateWithTrezor,
                },
                wipeData: true,
            });
            await prepareTrezorEmulator({
                seed: MNEMONICS.mnemonic_academic,
            });

            await onPassphrase.openPassphraseWallet(passphrase);
            await openSwapForm();
        });

        afterEach(async () => {
            await TrezorUserEnvLink.stopEmu();
        });

        afterAll(async () => {
            await device.terminateApp();
        });

        it('Basic exchange USDC to USDT', async () => {
            await tradingExchangeActions.selectSendAsset('USDC');
            await tradingExchangeActions.selectReceiveAsset('USDT', 'Ethereum');
            await tradingExchangeActions.selectReceiveAccount('Ethereum #1');
            await tradingExchangeActions.setSendCryptoAmount('10');
            await tradingExchangeActions.waitForQuotesToLoad();

            await tradingExchangeActions.scrollScreenToBottom();
            await tradingExchangeActions.viewProviders();
            await tradingExchangeActions.expectValidExchangeForm();

            await tradingExchangeActions.openLegalSheet();
            await tradingExchangeActions.closeBottomSheet();
            await tradingExchangeActions.expectValidExchangeForm();
            await tradingExchangeActions.confirmTradingForm();

            await exchangePreviewActions.expectExchangePreviewScreenToBeVisible();
            await exchangePreviewActions.waitForFeesToLoad();
            await exchangePreviewActions.scrollScreenToBottom();
            await exchangePreviewActions.goToFees();

            await tradingFeeActions.expectFeesScreenToBeVisible();
            await tradingFeeActions.goBack();

            await exchangePreviewActions.goToTransactionSigning();

            await outputsReviewActions.expectOutputsReviewScreenToBeVisible();
            await outputsReviewActions.expectAndConfirmRecipientAddress();
            await outputsReviewActions.expectAndConfirmTotalFee();
            await outputsReviewActions.signTransaction();
            await outputsReviewActions.expectSendTransactionButton();
            await outputsReviewActions.cancelTransaction();

            await tradingExchangeActions.waitForTradeDataToLoad();
        });
    });
});
