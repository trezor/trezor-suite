import { type Page } from '@playwright/test';

import { ExperimentId, messageSystemActions } from '@suite-common/message-system';
import { type NetworkSymbol } from '@suite-common/wallet-config';

import { step } from '../common';

export class HomeAssetsSection {
    readonly table = this.page.getByTestId('@dashboard/home-asset-table');
    readonly tableRows = this.table.getByRole('row');
    readonly assetRows = this.tableRows.filter({
        has: this.page.getByTestId('@dashboard/home-asset/name'),
    });
    readonly assetToken = (symbol: NetworkSymbol, contract: string) =>
        this.page.getByTestId(`@dashboard/home-asset-item/${symbol}/${contract}`);
    readonly expandButton = this.page.getByTestId('@dashboard/home-asset/expand');
    readonly groupingButton = this.page.getByTestId('@dashboard/home-asset/grouping');
    readonly groupByNetworks = this.page.getByTestId('@dashboard/home-asset/grouping/networks');
    readonly smallBalancesToggle = this.page.getByTestId(
        '@dashboard/home-asset/small-balances-toggle',
    );
    readonly smallBalancesSwitch = this.page
        .getByTestId('@dashboard/home-asset/small-balances')
        .getByRole('switch');
    readonly networkGroup = (symbol: NetworkSymbol) =>
        this.page.getByTestId(`@dashboard/home-asset-group/${symbol}`);
    readonly networkAssetNames = (symbol: NetworkSymbol) =>
        this.page
            .getByTestId(`@dashboard/home-asset-group/${symbol}/asset`)
            .getByTestId('@dashboard/home-asset/name');

    readonly hiddenTokensButton = this.page.getByTestId('@dashboard/home-asset/hidden-tokens');
    readonly unrecognizedTokens = this.page.getByTestId('@hidden-tokens/unrecognized');
    readonly hiddenToken = (symbol: NetworkSymbol, contract: string) =>
        this.unrecognizedTokens.getByTestId(`@hidden-tokens/item/${symbol}/${contract}`);
    readonly unhideModal = this.page.getByTestId('@hidden-tokens/unhide');
    readonly cancelUnhideButton = this.page.getByTestId('@hidden-tokens/unhide/cancel');
    readonly backButton = this.page.getByTestId('@hidden-tokens/back');
    readonly banner = this.page.getByTestId('@dashboard/home-asset/banner');
    readonly totalBalance = this.page.getByTestId('@dashboard/home-asset/fiat-amount');
    readonly feedbackHeading = this.page
        .getByTestId('@dashboard/home-asset/feedback')
        .getByRole('heading');

    constructor(private readonly page: Page) {}

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
