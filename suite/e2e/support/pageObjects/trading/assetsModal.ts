import { Locator, Page } from '@playwright/test';
import { CryptoId } from 'invity-api';

import { NetworkSymbol } from '@suite-common/wallet-config';

import { step } from '../../common';
import { AssetPickerNetworkFilter, BuyAsset, SellAsset } from '../../types';

export class TradingAssetsModal {
    readonly openSellAssetPickerModal: Locator;
    readonly openBuyAssetPickerModal: Locator;
    readonly assetPickerSearchInput: Locator;
    readonly assetPickerDisplaySymbol: Locator;
    readonly assetPickerNetworkFilter: Locator;
    readonly assetPickerNetworkFilterOption = (tab: AssetPickerNetworkFilter) =>
        this.page.getByTestId(`@asset-picker/search/filter/select-option/${tab}`);
    readonly addAccountButton: Locator;

    // buy and sell options
    readonly assetPickerOption = (networkSymbol: NetworkSymbol, tokenSymbol?: string) =>
        this.page.getByTestId(
            `@asset-picker/option/${networkSymbol}${tokenSymbol ? `/${tokenSymbol}` : ''}`,
        );
    readonly buyAssetPickerAssetOption = (assetCryptoId: CryptoId) =>
        this.page.getByTestId(`@asset-picker/option/asset/${assetCryptoId}`);

    // send and receive options
    readonly sendAssetPickerOption = (params: {
        accountSymbol: NetworkSymbol;
        accountType: string;
        index: number;
        tokenSymbol?: string;
    }) =>
        this.page.getByTestId(
            `@asset-picker/option/${params.accountType}/${params.accountSymbol}/${params.index}${
                params.tokenSymbol ? `/token/${params.tokenSymbol}` : ''
            }`,
        );
    readonly receiveAssetPickerOption = (params: {
        accountSymbol: NetworkSymbol;
        accountType: string;
        index: number;
    }) =>
        this.page.getByTestId(
            `@asset-picker/option/${params.accountType}/${params.accountSymbol}/${params.index}`,
        );

    constructor(private readonly page: Page) {
        this.openSellAssetPickerModal = this.page.getByTestId('@trading/sell/asset-picker/input');
        this.openBuyAssetPickerModal = this.page.getByTestId('@trading/buy/asset-picker/input');
        this.assetPickerSearchInput = this.page.getByTestId('@asset-picker/search/input');
        this.assetPickerDisplaySymbol = this.page.getByTestId('@asset-picker/display-symbol');
        this.assetPickerNetworkFilter = this.page.getByTestId(
            '@asset-picker/search/filter/control',
        );
        this.addAccountButton = this.page.getByTestId('@asset-picker/add-account');
    }

    @step()
    async filterByNetwork(networkFilter: AssetPickerNetworkFilter) {
        await this.assetPickerNetworkFilter.click();
        await this.assetPickerNetworkFilterOption(networkFilter).click();
    }

    @step()
    async searchAsset(searchFilter: string) {
        await this.assetPickerSearchInput.pressSequentially(searchFilter, { delay: 250 });
        await this.assetPickerSearchInput.blur();
    }

    @step()
    async selectSellAsset({ searchFilter, networkFilter, networkSymbol, tokenSymbol }: SellAsset) {
        await this.openSellAssetPickerModal.click();

        if (networkFilter) {
            await this.filterByNetwork(networkFilter);
        }

        if (searchFilter) {
            await this.searchAsset(searchFilter);
        }

        await this.assetPickerOption(networkSymbol, tokenSymbol).click();
    }

    @step()
    async selectBuyAsset({
        searchFilter,
        networkFilter,
        assetCryptoId,
        networkSymbol,
        tokenSymbol,
    }: BuyAsset) {
        await this.openBuyAssetPickerModal.click();

        if (networkFilter) {
            await this.filterByNetwork(networkFilter);
        }

        if (searchFilter) {
            await this.searchAsset(searchFilter);
        }

        if (assetCryptoId) {
            await this.buyAssetPickerAssetOption(assetCryptoId).click();
        } else if (networkSymbol) {
            await this.assetPickerOption(networkSymbol, tokenSymbol).click();
        } else {
            throw new Error('Either assetCryptoId or networkSymbol must be provided');
        }
    }
}
