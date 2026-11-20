import { type Locator, type Page } from '@playwright/test';

import { ExperimentId, messageSystemActions } from '@suite-common/message-system';
import { type NetworkSymbol } from '@suite-common/wallet-config';

import { step } from '../common';

export class HomeAssetsSection {
    readonly table: Locator;
    readonly tableRows: Locator;
    readonly assetRows: Locator;
    readonly assetToken = (symbol: NetworkSymbol, contract: string) =>
        this.page.getByTestId(`@dashboard/home-asset-item/${symbol}/${contract}`);
    readonly expandButton: Locator;
    readonly groupingButton: Locator;
    readonly groupByNetworks: Locator;
    readonly smallBalancesToggle: Locator;
    readonly smallBalancesSwitch: Locator;
    readonly networkGroup = (symbol: NetworkSymbol) =>
        this.page.getByTestId(`@dashboard/home-asset-group/${symbol}`);
    readonly networkAssetNames = (symbol: NetworkSymbol) =>
        this.page
            .getByTestId(`@dashboard/home-asset-group/${symbol}/asset`)
            .getByTestId('@dashboard/home-asset/name');

    readonly hiddenTokensButton: Locator;
    readonly unrecognizedTokens: Locator;
    readonly hiddenToken = (symbol: NetworkSymbol, contract: string) =>
        this.unrecognizedTokens.getByTestId(`@hidden-tokens/item/${symbol}/${contract}`);
    readonly backButton: Locator;
    readonly bannerTitle: Locator;
    readonly bannerDescription: Locator;
    readonly totalBalance: Locator;
    readonly feedbackHeading: Locator;

    constructor(private readonly page: Page) {
        this.table = this.page.getByTestId('@dashboard/home-asset-table');
        this.tableRows = this.table.getByRole('row');
        this.assetRows = this.tableRows.filter({
            has: this.page.getByTestId('@dashboard/home-asset/name'),
        });
        this.expandButton = this.page.getByTestId('@dashboard/home-asset/expand');
        this.groupingButton = this.page.getByTestId('@dashboard/home-asset/grouping');
        this.groupByNetworks = this.page.getByTestId('@dashboard/home-asset/grouping/networks');
        this.smallBalancesToggle = this.page.getByTestId(
            '@dashboard/home-asset/small-balances-toggle',
        );
        this.smallBalancesSwitch = this.page
            .getByTestId('@dashboard/home-asset/small-balances')
            .getByRole('switch');
        this.hiddenTokensButton = this.page.getByTestId('@dashboard/home-asset/hidden-tokens');
        this.unrecognizedTokens = this.page.getByTestId('@hidden-tokens/unrecognized');
        this.backButton = this.page.getByTestId('@hidden-tokens/back');
        this.bannerTitle = this.page.getByTestId('@dashboard/home-asset/banner/title');
        this.bannerDescription = this.page.getByTestId('@dashboard/home-asset/banner/description');
        this.totalBalance = this.page.getByTestId('@dashboard/home-asset/fiat-amount');
        this.feedbackHeading = this.page
            .getByTestId('@dashboard/home-asset/feedback')
            .getByRole('heading');
    }

    @step()
    async enableAssetHome() {
        await this.page.ensureStoreOnDesktop();
        await this.page.expectReduxObjectNotToBeEmpty('messageSystem.config');
        await this.page.evaluate(
            actions => actions.forEach(action => window.store.dispatch(action)),
            [
                messageSystemActions.removeExperiment(ExperimentId.assetFirstHomeTable),
                messageSystemActions.addExperiment({
                    conditions: [],
                    experiment: {
                        id: ExperimentId.assetFirstHomeTable,
                        groups: [{ variant: 'B', percentage: 100 }],
                    },
                }),
                messageSystemActions.setExperimentInclusionOverride({
                    id: ExperimentId.assetFirstHomeTable,
                    inclusion: 0,
                }),
            ],
        );
    }
}
