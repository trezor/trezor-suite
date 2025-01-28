import { Locator, Page, expect } from '@playwright/test';

import { NetworkSymbol } from '@suite-common/wallet-config';

import { step } from '../common';

export class AssetsActions {
    readonly section: Locator;
    readonly tableIcon: Locator;
    readonly gridIcon: Locator;
    readonly buyAssetButton = (symbol: NetworkSymbol) =>
        this.page.getByTestId(`@dashboard/asset/${symbol}/buy-button`);
    readonly enableMoreCoins: Locator;
    readonly assetCard = (symbol: NetworkSymbol) =>
        this.page.getByTestId(`@dashboard/asset-card/${symbol}`);
    readonly assetRow = (symbol: NetworkSymbol) =>
        this.page.getByTestId(`@dashboard/asset-row/${symbol}`);
    readonly assetFiatAmount = (symbol: NetworkSymbol) =>
        this.page.getByTestId(`@dashboard/asset/${symbol}/fiat-amount`);
    readonly bottomInfo: Locator;
    readonly assetExchangeRate: Locator;
    readonly assetWeekChange: Locator;

    constructor(private readonly page: Page) {
        this.section = page.getByTestId('@dashboard/assets');
        this.tableIcon = this.page.getByTestId('@dashboard/assets/table-icon');
        this.gridIcon = this.page.getByTestId('@dashboard/assets/grid-icon');
        this.enableMoreCoins = this.page.getByTestId('@dashboard/assets/enable-more-coins');
        this.bottomInfo = this.page.getByTestId('@dashboard/asset/bottom-info');
        this.assetExchangeRate = this.page.getByTestId('@dashboard/asset/exchange-rate');
        this.assetWeekChange = this.page.getByTestId('@dashboard/asset/week-change');
    }

    @step()
    async verifyAssetContents() {
        await expect(
            this.page.getByTestId('@dashboard/asset-item/btc').getByTestId('@dashboard/asset/name'),
        ).toHaveText('Bitcoin');
        await expect(
            this.page.getByTestId('@dashboard/asset-item/eth').getByTestId('@dashboard/asset/name'),
        ).toHaveText('Ethereum');
        await expect(this.page.getByTestId('@dashboard/asset/btc/fiat-amount')).toHaveText('$0.00');
        await expect(this.page.getByTestId('@dashboard/asset/eth/fiat-amount')).toContainText(
            '$0.00',
        );
    }
}
