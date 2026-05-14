import { expect as detoxExpect } from 'detox';

import { onTabBar } from '../tabBarActions';
import { TradingActions } from './TradingActions';
import { wait, waitForVisible } from '../../support/utils';

export abstract class TradingFormActions extends TradingActions {
    abstract waitForQuotesToLoad(): Promise<void>;

    getSearchReceiveCryptoElement() {
        return this.getElementById('receive-asset-sheet/header/search-input');
    }

    getSearchFiatElement() {
        return this.getElementById('fiat-search-input');
    }

    getSearchCountryElement() {
        return this.getElementById('country/search-input');
    }

    getFiatAmountElement() {
        return this.getElementById('fiat-amount-input');
    }

    getReceiveCryptoAmountElement() {
        return this.getElementById('crypto-amount-input');
    }

    getSendCryptoAmountElement() {
        return this.getElementById('send-amount-input');
    }

    async waitForTradeDataToLoad() {
        await waitForVisible(this.getElementById('form'));
    }

    async expectSheetHeaderTitle(title: string) {
        await waitForVisible(element(by.text(title).and(by.id('@trading/sheet-header-title'))));
    }

    async selectFiatCurrency(fiatCurrency: string) {
        await this.getElementById('fiat-button').tap();
        await this.expectSheetHeaderTitle('Currency');

        const searchFiatInput = this.getSearchFiatElement();
        await searchFiatInput.tap();
        await wait(this.BOTTOM_SHEET_ANIMATION_DURATION);
        await searchFiatInput.replaceText(fiatCurrency.slice(0, -1));
        await wait(this.BOTTOM_SHEET_ANIMATION_DURATION);
        await waitForVisible(by.text(fiatCurrency));
        await element(by.text(fiatCurrency)).tap();

        await waitFor(this.getElementById('fiat-button/ticker'))
            .toHaveText(fiatCurrency)
            .withTimeout(this.SHORT_TIMEOUT);
    }

    async selectCountry(countrySearch: string, country: string, shortLabel: string) {
        const countryPicker = this.getElementById('country');
        await waitForVisible(countryPicker, { timeout: this.SHORT_TIMEOUT });
        await countryPicker.tap();

        await this.expectSheetHeaderTitle('Country of residence');
        const countrySearchInput = this.getSearchCountryElement();
        await countrySearchInput.tap();
        await wait(this.BOTTOM_SHEET_ANIMATION_DURATION);
        await countrySearchInput.replaceText(countrySearch);
        await waitForVisible(by.text(country));
        await element(by.text(country)).tap();

        await waitFor(this.getElementById('country/value'))
            .toHaveText(shortLabel)
            .withTimeout(this.SHORT_TIMEOUT);
    }

    async selectReceiveAccount(accountName: string, derivationPath?: string) {
        const receiveAccountPicker = this.getElementById('receive-account');
        await waitForVisible(receiveAccountPicker, { timeout: this.SHORT_TIMEOUT });
        await receiveAccountPicker.tap();

        await waitForVisible(by.text(accountName));
        await element(by.text(accountName)).tap();

        if (derivationPath) {
            await waitForVisible(by.text(derivationPath));
            await element(by.text(derivationPath)).tap();
        }

        await detoxExpect(this.getElementById('receive-account/selected-account')).toHaveText(
            accountName,
        );
    }

    async selectBtcReceiveAccount(accountName: string, derivationPath: string) {
        await this.selectReceiveAccount(accountName, derivationPath);
        await this.expectReceiveAccountBalance('0 BTC');
    }

    async expectReceiveAccountBalance(expectedValue: string) {
        await detoxExpect(this.getElementById('receive-account-balance')).toBeVisible();
        await detoxExpect(this.getElementById('receive-account-balance/value')).toHaveText(
            expectedValue,
        );
    }

    async setAmountValue(amount: string, getElement: () => Detox.IndexableNativeElement) {
        await getElement().tap();
        await wait(100);
        await getElement().replaceText(amount);
        await wait(100);
        await getElement().tapReturnKey();
        await this.waitForQuotesToLoad();
        await wait(300);
    }

    setFiatAmount(amount: string) {
        return this.setAmountValue(amount, this.getFiatAmountElement.bind(this));
    }

    setSendCryptoAmount(amount: string) {
        return this.setAmountValue(amount, this.getSendCryptoAmountElement.bind(this));
    }

    async viewProviders() {
        const providersPicker = this.getElementById('provider-picker');
        await waitForVisible(providersPicker, { timeout: this.SHORT_TIMEOUT });
        await providersPicker.tap();

        await wait(this.BOTTOM_SHEET_ANIMATION_DURATION);
        await this.expectSheetHeaderTitle('Providers');
        await element(by.label('Close')).tap();
        await waitForVisible(providersPicker);
    }

    async selectReceiveAsset(asset: string, network?: string, searchString?: string) {
        const receiveAssetButton = this.getElementById('asset-receive-button');
        await waitForVisible(receiveAssetButton, { timeout: this.SHORT_TIMEOUT });
        await receiveAssetButton.tap();

        await this.expectSheetHeaderTitle('Assets');

        const searchReceiveCryptoInput = this.getSearchReceiveCryptoElement();
        await searchReceiveCryptoInput.tap();
        await wait(this.BOTTOM_SHEET_ANIMATION_DURATION);
        const searchForStr = searchString ?? asset;
        await searchReceiveCryptoInput.replaceText(searchForStr.slice(0, -1));

        if (network) {
            const networkFilterTab = element(
                by.text(network).withAncestor(by.id(this.getTestId('receive-asset-sheet/header'))),
            );
            await waitForVisible(networkFilterTab);
            await networkFilterTab.tap();
        }

        await waitForVisible(by.text(asset));
        await element(by.text(asset)).tap();

        await waitFor(this.getElementById('asset-receive-button/symbol'))
            .toHaveText(asset)
            .withTimeout(this.SHORT_TIMEOUT);
    }

    async selectSendAsset(asset: string) {
        await this.getElementById('asset-send-button').tap();
        await this.expectSheetHeaderTitle('Your assets');

        await element(by.text(asset)).atIndex(0).tap();

        await detoxExpect(this.getElementById('asset-send-button/symbol')).toHaveText(asset);
    }

    async confirmTradingForm() {
        await this.getElementById('continue-button').tap();
    }

    async tapTradingSectionHeaderTab() {
        await this.getElementById('header-tab').tap();
    }

    async expectPortfolioTrackerInfoCard() {
        await detoxExpect(this.getElementById('portfolio-tracker-info')).toBeVisible();
    }

    async openForm() {
        await onTabBar.navigateToTrade();
        await this.tapTradingSectionHeaderTab();
        await this.waitForTradeDataToLoad();
    }
}
