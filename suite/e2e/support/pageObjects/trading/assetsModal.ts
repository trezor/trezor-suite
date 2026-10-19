import { Locator, Page } from '@playwright/test';
import type { CryptoId } from 'invity-api';

import type { NetworkSymbol } from '@suite-common/wallet-config';

import { step } from '../../common';
import { expect } from '../../testExtends/customMatchers';
import { AssetPickerNetworkFilter, BuyAsset, SellAsset, SellAssetGroup } from '../../types';

type SellAccountParams = {
    accountSymbol: NetworkSymbol;
    accountType: string;
    index: number;
};

const getSellOptionTestId = ({ accountType, accountSymbol, index }: SellAccountParams) =>
    `@asset-picker/sell/option/${accountType}/${accountSymbol}/${index}`;

const NETWORK_FILTER_OPTION_TESTID_PREFIX = '@asset-picker/search/filter/select-option/';

export class TradingAssetPicker {
    readonly openSellModal: Locator;
    readonly openBuyModal: Locator;
    readonly searchInput: Locator;
    readonly networkFilterButton: Locator;
    readonly sendReceiveNetworkFilterSelect: Locator;
    readonly networkFilterOption = (tab: AssetPickerNetworkFilter | NetworkSymbol) =>
        this.page.getByTestId(`@asset-picker/search/filter/select-option/${tab}`);
    // The filter menu is not virtualized, so opening it renders every option at once.
    readonly renderedNetworkFilterOptions: Locator;
    readonly selectedNetworkFilterIcon = (network: AssetPickerNetworkFilter | NetworkSymbol) =>
        this.page
            .getByTestId(`@asset-picker/search/filter/select-option-value/${network}`)
            .locator('svg');

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

    constructor(private readonly page: Page) {
        this.openSellModal = this.page.getByTestId('@trading/sell/asset-picker');
        this.openBuyModal = this.page.getByTestId('@trading/buy/asset-picker');
        this.searchInput = this.page.getByTestId('@asset-picker/search/input');
        this.networkFilterButton = this.page.getByTestId('@asset-picker/search/filter');
        this.sendReceiveNetworkFilterSelect = this.page.getByTestId(
            '@asset-picker/search/filter/input',
        );
        this.renderedNetworkFilterOptions = this.page.getByTestId(
            new RegExp(`^${NETWORK_FILTER_OPTION_TESTID_PREFIX}`),
        );
    }

    @step()
    async filterByNetwork(networkFilter: AssetPickerNetworkFilter | NetworkSymbol) {
        // use global retry helper since opening the dropdown is flaky in automation
        await this.page.selectDropdownOptionWithRetry(
            this.networkFilterButton,
            this.networkFilterOption(networkFilter),
        );
    }

    /**
     * Every network the send/receive filter offers. The menu hides whatever is currently selected,
     * so this has to run with no network filter applied to see them all.
     */
    @step()
    async getSendReceiveNetworkFilterOptions(): Promise<string[]> {
        // Opening the menu is flaky in automation, so the click is retried until options appear.
        await expect(async () => {
            if ((await this.renderedNetworkFilterOptions.count()) === 0) {
                await this.sendReceiveNetworkFilterSelect.click({ timeout: 2000 });
            }
            expect(await this.renderedNetworkFilterOptions.count()).toBeGreaterThan(0);
        }).toPass({ timeout: 10_000 });

        const options = await this.renderedNetworkFilterOptions.all();
        const testIds = await Promise.all(
            options.map(option => option.getAttribute('data-testid')),
        );
        // Escape would close the surrounding modal, so the menu is dismissed by blurring it.
        await this.searchInput.click();
        await expect.poll(() => this.renderedNetworkFilterOptions.count()).toBe(0);

        return testIds
            .filter((testId): testId is string => testId !== null)
            .map(testId => testId.replace(NETWORK_FILTER_OPTION_TESTID_PREFIX, ''));
    }

    @step()
    async filterSendReceiveByNetwork(networkFilter: AssetPickerNetworkFilter | NetworkSymbol) {
        await this.page.selectDropdownOptionWithRetry(
            this.sendReceiveNetworkFilterSelect,
            this.networkFilterOption(networkFilter),
        );
    }

    @step()
    async clearSearch() {
        await this.searchInput.fill('');
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
