import { Locator, Page } from '@playwright/test';
import type { CryptoId } from 'invity-api';

import type { NetworkSymbol } from '@suite-common/wallet-config';

import { step } from '../../common';
import { AssetPickerNetworkFilter, BuyAsset, SellAsset } from '../../types';

export class TradingAssetPicker {
    readonly openSellModal: Locator;
    readonly openBuyModal: Locator;
    readonly searchInput: Locator;
    readonly displaySymbol: Locator;
    readonly networkFilterButton: Locator;
    readonly buyNetworkFilterButton: Locator;
    readonly networkFilterOption = (tab: AssetPickerNetworkFilter) =>
        this.page.getByTestId(`@asset-picker/search/filter/select-option/${tab}`);
    readonly globalAddAccountButton: Locator;

    // buy and sell options
    readonly sellOption = (networkSymbol: NetworkSymbol, tokenSymbol?: string) =>
        this.page.getByTestId(
            `@asset-picker/sell/option/${networkSymbol}${tokenSymbol ? `/${tokenSymbol}` : ''}`,
        );
    readonly buyAssetOption = (assetCryptoId: CryptoId) =>
        this.page.getByTestId(`@asset-picker/buy/option/asset/${assetCryptoId}`);

    // send and receive options
    readonly sendOption = (params: {
        accountSymbol: NetworkSymbol;
        accountType: string;
        index: number;
        tokenSymbol?: string;
    }) =>
        this.page.getByTestId(
            `@asset-picker/send/option/${params.accountType}/${params.accountSymbol}/${params.index}${
                params.tokenSymbol ? `/token/${params.tokenSymbol}` : ''
            }`,
        );
    readonly receiveOption = (params: {
        accountSymbol: NetworkSymbol;
        accountType: string;
        index: number;
    }) =>
        this.page.getByTestId(
            `@global-receive-account/${params.accountType}/${params.accountSymbol}/${params.index}`,
        );

    constructor(private readonly page: Page) {
        this.openSellModal = this.page.getByTestId('@trading/sell/asset-picker');
        this.openBuyModal = this.page.getByTestId('@trading/buy/asset-picker');
        this.searchInput = this.page.getByTestId('@asset-picker/search/input');
        this.displaySymbol = this.page.getByTestId('@asset-picker/display-symbol');
        this.networkFilterButton = this.page.getByTestId('@asset-picker/search/filter/input');
        this.buyNetworkFilterButton = this.page.getByTestId('@asset-picker/search/filter');
        this.globalAddAccountButton = this.page.getByTestId('@global-send-receive/add-account');
    }

    @step()
    async filterByNetwork(networkFilter: AssetPickerNetworkFilter) {
        // use global retry helper since opening the dropdown is flaky in automation
        await this.page.selectDropdownOptionWithRetry(
            this.networkFilterButton,
            this.networkFilterOption(networkFilter),
        );
    }

    // buy opens the network list from a button, not a select; merges back once sell follows in 30208
    @step()
    async filterBuyByNetwork(networkFilter: AssetPickerNetworkFilter) {
        await this.page.selectDropdownOptionWithRetry(
            this.buyNetworkFilterButton,
            this.networkFilterOption(networkFilter),
        );
    }

    @step()
    async searchAsset(searchFilter: string) {
        await this.searchInput.pressSequentially(searchFilter, { delay: 250 });
        await this.searchInput.blur();
    }

    @step()
    async selectSellAsset({
        searchFilter,
        networkFilter,
        networkSymbol,
        tokenSymbol,
        accountIndex = 0,
    }: SellAsset) {
        await this.openSellModal.click();

        if (networkFilter) {
            await this.filterByNetwork(networkFilter);
        }

        if (searchFilter) {
            await this.searchAsset(searchFilter);
        }

        await this.sellOption(networkSymbol, tokenSymbol).nth(accountIndex).click();
    }

    @step()
    async selectBuyAsset({ searchFilter, networkFilter, assetCryptoId }: BuyAsset) {
        await this.openBuyModal.click();

        if (networkFilter) {
            await this.filterBuyByNetwork(networkFilter);
        }

        if (searchFilter) {
            await this.searchAsset(searchFilter);
        }

        await this.buyAssetOption(assetCryptoId).click();
    }
}
