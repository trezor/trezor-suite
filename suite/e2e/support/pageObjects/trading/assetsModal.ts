import { Locator, Page } from '@playwright/test';
import { CryptoId } from 'invity-api';

import { NetworkSymbol } from '@suite-common/wallet-config';

import { step } from '../../common';
import { AssetPickerNetworkFilter, BuyAsset, SellAsset } from '../../types';

export class TradingAssetsModal {
    readonly sellAssetPickerInput: Locator;
    readonly buyAssetPickerInput: Locator;

    readonly assetPickerSearchInput: Locator;
    readonly assetPickerNetworkFilter: Locator;
    readonly assetPickerDisplaySymbol: Locator;
    readonly assetPickerNetworkFilterOption = (tab: AssetPickerNetworkFilter) =>
        this.page.getByTestId(`@asset-picker/search/select-option/${tab}`);
    readonly assetPickerOption = (networkSymbol: NetworkSymbol, tokenSymbol?: string) =>
        this.page.getByTestId(
            `@asset-picker/option/${networkSymbol}${tokenSymbol ? `/${tokenSymbol}` : ''}`,
        );
    readonly buyAssetPickerAssetOption = (assetCryptoId: CryptoId) =>
        this.page.getByTestId(`@asset-picker/option/asset/${assetCryptoId}`);

    constructor(private readonly page: Page) {
        this.sellAssetPickerInput = this.page.getByTestId('@trading/sell/asset-picker/input');
        this.buyAssetPickerInput = this.page.getByTestId('@trading/buy/asset-picker/input');
        this.assetPickerDisplaySymbol = this.page.getByTestId('@asset-picker/display-symbol');
        this.assetPickerSearchInput = this.page.getByTestId('@asset-picker/search');
        this.assetPickerNetworkFilter = this.page.getByTestId('@asset-picker/search/select/input');
    }

    @step()
    async selectSellAsset({ searchFilter, networkFilter, networkSymbol, tokenSymbol }: SellAsset) {
        await this.sellAssetPickerInput.click();

        if (networkFilter) {
            await this.assetPickerNetworkFilter.click();
            await this.assetPickerNetworkFilterOption(networkFilter).click();
        }

        if (searchFilter) {
            await this.assetPickerSearchInput.pressSequentially(searchFilter, { delay: 250 });
            await this.assetPickerSearchInput.blur();
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
        await this.buyAssetPickerInput.click();

        if (networkFilter) {
            await this.assetPickerNetworkFilter.click();
            await this.assetPickerNetworkFilterOption(networkFilter).click();
        }

        if (searchFilter) {
            await this.assetPickerSearchInput.pressSequentially(searchFilter, { delay: 250 });
            await this.assetPickerSearchInput.blur();
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
