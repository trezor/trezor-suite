import { Locator, Page } from '@playwright/test';
import type { CryptoId } from 'invity-api';

import type { NetworkSymbol } from '@suite-common/wallet-config';

import { step } from '../../common';
import { AssetPickerNetworkFilter, BuyAsset, SellAsset, SellAssetGroup } from '../../types';

type SellAccountParams = {
    accountSymbol: NetworkSymbol;
    accountType: string;
    index: number;
};

const getSellOptionTestId = ({ accountType, accountSymbol, index }: SellAccountParams) =>
    `@asset-picker/sell/option/${accountType}/${accountSymbol}/${index}`;

export class TradingAssetPicker {
    readonly openSellModal: Locator;
    readonly openBuyModal: Locator;
    readonly searchInput: Locator;
    readonly displaySymbol: Locator;
    readonly networkFilterButton: Locator;
    readonly sendReceiveNetworkFilterSelect: Locator;
    readonly networkFilterOption = (tab: AssetPickerNetworkFilter | NetworkSymbol) =>
        this.page.getByTestId(`@asset-picker/search/filter/select-option/${tab}`);
    readonly globalAddAccountButton: Locator;

    // buy and sell options
    readonly sellOption = (params: SellAccountParams & { tokenSymbol?: string }) =>
        this.page.getByTestId(
            `${getSellOptionTestId(params)}${
                params.tokenSymbol ? `/token/${params.tokenSymbol}` : ''
            }`,
        );
    readonly sellGroup = (params: SellAccountParams & { group: SellAssetGroup }) =>
        this.page.getByTestId(`${getSellOptionTestId(params)}/${params.group}`);
    readonly sellGroupToggle = (params: SellAccountParams & { group: SellAssetGroup }) =>
        this.page.getByTestId(`${getSellOptionTestId(params)}/${params.group}/toggle`);
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
        this.networkFilterButton = this.page.getByTestId('@asset-picker/search/filter');
        this.sendReceiveNetworkFilterSelect = this.page.getByTestId(
            '@asset-picker/search/filter/input',
        );
        this.globalAddAccountButton = this.page.getByTestId('@global-send-receive/add-account');
    }

    @step()
    async filterByNetwork(networkFilter: AssetPickerNetworkFilter | NetworkSymbol) {
        // use global retry helper since opening the dropdown is flaky in automation
        await this.page.selectDropdownOptionWithRetry(
            this.networkFilterButton,
            this.networkFilterOption(networkFilter),
        );
    }

    @step()
    async filterSendReceiveByNetwork(networkFilter: AssetPickerNetworkFilter | NetworkSymbol) {
        await this.page.selectDropdownOptionWithRetry(
            this.sendReceiveNetworkFilterSelect,
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
        accountType = 'normal',
        accountIndex = 0,
        group,
    }: SellAsset) {
        await this.openSellModal.click();

        if (networkFilter) {
            await this.filterByNetwork(networkFilter);
        }

        if (searchFilter) {
            await this.searchAsset(searchFilter);
        }

        const account = { accountSymbol: networkSymbol, accountType, index: accountIndex };

        if (group) {
            await this.sellGroupToggle({ ...account, group }).click();
        }

        await this.sellOption({ ...account, tokenSymbol }).click();
    }

    @step()
    async selectBuyAsset({ searchFilter, networkFilter, assetCryptoId }: BuyAsset) {
        await this.openBuyModal.click();

        if (networkFilter) {
            await this.filterByNetwork(networkFilter);
        }

        if (searchFilter) {
            await this.searchAsset(searchFilter);
        }

        await this.buyAssetOption(assetCryptoId).click();
    }
}
