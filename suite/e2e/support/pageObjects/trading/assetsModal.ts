import { Locator, Page } from '@playwright/test';
import { CryptoId } from 'invity-api';

import { NetworkConfigWithoutTestnets, NetworkSymbol } from '@suite-common/wallet-config';

import { step } from '../../common';

type AssetPickerNetworkFilter = 'all-networks' | NetworkConfigWithoutTestnets['symbol'];

export class TradingAssetsModal {
    // `From` field asset picker in swap/sell form
    readonly sellAssetPickerInput: Locator;
    readonly sellAssetPickerSearchInput: Locator;
    readonly sellAssetPickerNetworkFilter: Locator;
    readonly sellAssetPickerDisplaySymbol: Locator;

    readonly sellAssetPickerNetworkFilterOption = (tab: AssetPickerNetworkFilter) =>
        this.page.getByTestId(`@trading/form/select-crypto-for-sell/search/select-option/${tab}`);

    readonly sellAssetPickerTokenOption = (networkSymbol?: NetworkSymbol, tokenSymbol?: string) =>
        this.page.getByTestId(
            `@trading/form/select-crypto-for-sell/token/${networkSymbol}/${tokenSymbol}`,
        );
    readonly sellAssetPickerAccountOption = (networkSymbol?: NetworkSymbol) =>
        this.page.getByTestId(`@trading/form/select-crypto-for-sell/account/${networkSymbol}`);

    // `To` field asset picker in swap/buy form
    readonly buyAssetPickerInput: Locator;
    readonly buyAssetPickerSearchInput: Locator;
    readonly buyAssetPickerNetworkFilter: Locator;
    readonly buyAssetPickerDisplaySymbol: Locator;

    readonly buyAssetPickerNetworkFilterOption = (tab: AssetPickerNetworkFilter) =>
        this.page.getByTestId(`@trading/form/select-crypto-for-buy/search/select-option/${tab}`);

    readonly buyAssetPickerTokenOption = (networkSymbol?: NetworkSymbol, tokenSymbol?: string) =>
        this.page.getByTestId(
            `@trading/form/select-crypto-for-buy/token/${networkSymbol}/${tokenSymbol}`,
        );
    readonly buyAssetPickerAccountOption = (networkSymbol?: NetworkSymbol) =>
        this.page.getByTestId(`@trading/form/select-crypto-for-buy/account/${networkSymbol}`);
    readonly buyAssetPickerTopAssetOption = (id: CryptoId) =>
        this.page.getByTestId(`@trading/form/select-crypto-for-buy/top-assets/asset/${id}`);
    readonly buyAssetPickerAssetOption = (id: CryptoId) =>
        this.page.getByTestId(`@trading/form/select-crypto-for-buy/asset/${id}`);

    constructor(private readonly page: Page) {
        this.sellAssetPickerInput = this.page.getByTestId(
            '@trading/form/select-crypto-for-sell/input',
        );
        this.sellAssetPickerDisplaySymbol = this.page.getByTestId(
            '@trading/form/select-crypto-for-sell/display-symbol',
        );
        this.sellAssetPickerSearchInput = this.page.getByTestId(
            '@trading/form/select-crypto-for-sell/search',
        );
        this.sellAssetPickerNetworkFilter = this.page.getByTestId(
            '@trading/form/select-crypto-for-sell/search/select/input',
        );

        this.buyAssetPickerInput = this.page.getByTestId(
            '@trading/form/select-crypto-for-buy/input',
        );
        this.buyAssetPickerDisplaySymbol = this.page.getByTestId(
            '@trading/form/select-crypto-for-buy/display-symbol',
        );
        this.buyAssetPickerSearchInput = this.page.getByTestId(
            '@trading/form/select-crypto-for-buy/search',
        );
        this.buyAssetPickerNetworkFilter = this.page.getByTestId(
            '@trading/form/select-crypto-for-buy/search/select/input',
        );
    }

    @step()
    async selectSellAsset({
        searchFilter,
        networkFilter,
        networkSymbol,
        tokenSymbol,
    }: {
        searchFilter?: string;
        networkFilter?: AssetPickerNetworkFilter;
        networkSymbol?: NetworkSymbol;
        tokenSymbol?: string;
    }) {
        await this.sellAssetPickerInput.click();

        if (networkFilter) {
            await this.sellAssetPickerNetworkFilter.click();
            await this.sellAssetPickerNetworkFilterOption(networkFilter).click();
        }

        if (searchFilter) {
            await this.sellAssetPickerSearchInput.pressSequentially(searchFilter, { delay: 250 });
            await this.sellAssetPickerSearchInput.blur();
        }

        if (networkSymbol && tokenSymbol) {
            await this.sellAssetPickerTokenOption(networkSymbol, tokenSymbol).click();
        } else if (networkSymbol) {
            await this.sellAssetPickerAccountOption(networkSymbol).click();
        }
    }

    @step()
    async selectBuyAsset({
        searchFilter,
        networkFilter,
        assetCryptoId,
        networkSymbol,
        tokenSymbol,
    }: {
        searchFilter?: string;
        networkFilter?: AssetPickerNetworkFilter;

        assetCryptoId?: CryptoId;
        networkSymbol?: NetworkSymbol;
        tokenSymbol?: string;
    }) {
        await this.buyAssetPickerInput.click();

        if (networkFilter) {
            await this.buyAssetPickerNetworkFilter.click();
            await this.buyAssetPickerNetworkFilterOption(networkFilter).click();
        }

        if (searchFilter) {
            await this.buyAssetPickerSearchInput.pressSequentially(searchFilter, { delay: 250 });
            await this.buyAssetPickerSearchInput.blur();
        }

        if (networkSymbol && tokenSymbol) {
            await this.buyAssetPickerTokenOption(networkSymbol, tokenSymbol).click();
        } else if (networkSymbol) {
            await this.buyAssetPickerAccountOption(networkSymbol).click();
        } else if (assetCryptoId) {
            await this.buyAssetPickerAssetOption(assetCryptoId).click();
        }
    }
}
