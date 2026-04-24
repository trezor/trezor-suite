import { MNEMONICS } from '@trezor/trezor-user-env-link';

import { ethCoinEnabled } from '../fixtures/ethCoinEnabled';
import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { portfolioTrackerBtcAccountState } from '../fixtures/portfolioTrackerBtcAccountState';
import { onDeviceConnecting } from '../pageObjects/deviceConnectingActions';
import { onHome } from '../pageObjects/homeActions';
import { onPassphrase } from '../pageObjects/passphraseModule';
import { onTabBar } from '../pageObjects/tabBarActions';
import { exchangeOutputsReviewActions } from '../pageObjects/trading/outputsReviewActions';
import { sellPreviewActions } from '../pageObjects/trading/sellPreviewActions';
import { tradingSellActions } from '../pageObjects/trading/tradingSellActions';
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

describe('Trade Sell [@androidOnly]', () => {
    describe('with portfolio tracker [@noDevice]', () => {
        beforeEach(async () => {
            await openApp({ args: { preloadedState: preloadedStateWithoutTrezor } });
            await onTabBar.navigateToTrade();
            await tradingSellActions.tapTradingSectionHeaderTab();
        });

        it('should display info card', async () => {
            await tradingSellActions.expectPortfolioTrackerInfoCard();
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
            await openApp({ args: { preloadedState: preloadedStateWithTrezor } });
            await prepareTrezorEmulator({
                seed: MNEMONICS.mnemonic_academic,
                passphrase_protection: true,
            });
            await waitForVisible(by.text('Connected'));
            await onPassphrase.openPassphraseWallet(passphrase);
            await onHome.waitForScreen();
            await onDeviceConnecting.stopEmuAndConfirmViewOnlyWarning();
            await tradingSellActions.openForm();
        });

        it('should request trezor connect before preview', async () => {
            await tradingSellActions.selectCountry('Czechi', 'Czechia', 'CZE');
            await tradingSellActions.selectFiatCurrency('EUR');
            await tradingSellActions.selectSendAsset('USDC');
            await tradingSellActions.setSendCryptoAmount('55');

            await tradingSellActions.scrollToLearnMoreLink();
            await tradingSellActions.expectValidSellForm();

            await tradingSellActions.confirmTradingForm();

            await exchangeOutputsReviewActions.expectConnectTrezorInfo();
            await exchangeOutputsReviewActions.cancelConnectTrezorInfo();

            await tradingSellActions.waitForTradeDataToLoad();
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
            await openApp({ args: { preloadedState: preloadedStateWithTrezor } });
            await prepareTrezorEmulator({
                seed: MNEMONICS.mnemonic_academic,
                passphrase_protection: true,
            });
            await waitForVisible(by.text('Connected'));
            await onPassphrase.openPassphraseWallet(passphrase);
            await tradingSellActions.openForm();
        });

        it('Basic sell USDC for EUR', async () => {
            await tradingSellActions.selectCountry('Czechi', 'Czechia', 'CZE');
            await tradingSellActions.selectFiatCurrency('EUR');
            await tradingSellActions.selectSendAsset('USDC');
            await tradingSellActions.setSendCryptoAmount('55');

            await tradingSellActions.scrollToLearnMoreLink();
            await tradingSellActions.expectValidSellForm();

            await tradingSellActions.viewReceiveMethods();
            await tradingSellActions.viewProviders();

            await tradingSellActions.confirmTradingForm();

            await sellPreviewActions.expectBrowserAuthTriggered();

            await sellPreviewActions.expectConfirmationInProgress();
            await sellPreviewActions.expectConfirmationToFail();
        });
    });
});
