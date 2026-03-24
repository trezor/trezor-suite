import { Locator, Page } from '@playwright/test';

export class TransactionDetailSidebar {
    readonly container: Locator;
    readonly sendSection: Locator;
    readonly sendAccount: Locator;
    readonly sendAssetName: Locator;
    readonly sendNetworkName: Locator;
    readonly receiveSection: Locator;
    readonly receiveAccount: Locator;
    readonly receiveAssetName: Locator;
    readonly receiveNetworkName: Locator;
    readonly cryptoAmounts: Locator;

    constructor(page: Page) {
        this.container = page.getByTestId('@trading/transaction/detail/sidebar');
        this.sendSection = this.container.getByTestId('@trading/detail/send-info');
        this.sendAccount = this.container.getByTestId('@trading/detail/send-account');
        this.sendAssetName = this.container.getByTestId('@trading/detail/send-asset-name');
        this.sendNetworkName = this.container.getByTestId('@trading/detail/send-network-name');
        this.receiveSection = this.container.getByTestId('@trading/detail/receive-info');
        this.receiveAccount = this.container.getByTestId('@trading/detail/receive-account');
        this.receiveAssetName = this.container.getByTestId('@trading/detail/receive-asset-name');
        this.receiveNetworkName = this.container.getByTestId(
            '@trading/detail/receive-network-name',
        );
        this.cryptoAmounts = this.container.getByTestId('@trading/form/info/crypto-amount');
    }
}
