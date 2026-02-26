import { Locator, Page } from '@playwright/test';

export class TransactionDetailSidebar {
    readonly container: Locator;
    readonly sendSection: Locator;
    readonly sendAccount: Locator;
    readonly sendAssetName: Locator;
    readonly sendNetworkName: Locator;
    readonly sendAmount: Locator;
    readonly receiveSection: Locator;
    readonly receiveAccount: Locator;
    readonly receiveAssetName: Locator;
    readonly receiveNetworkName: Locator;
    readonly receiveAmount: Locator;
    readonly cryptoAmounts: Locator;
    readonly statusCard: Locator;
    readonly providerInStatusCard: Locator;
    readonly orderIdInStatusCard: Locator;

    constructor(page: Page) {
        this.container = page.getByTestId('@trading/transaction/detail/sidebar');
        this.sendSection = this.container.getByTestId('@trading/detail/send-info');
        this.sendAccount = this.container.getByTestId('@trading/transaction/detail/send-account');
        this.sendAssetName = this.container.getByTestId('@trading/detail/send-asset-name');
        this.sendNetworkName = this.container.getByTestId('@trading/detail/send-network-name');
        this.sendAmount = this.sendSection.getByTestId('@trading/form/info/crypto-amount');
        this.receiveSection = this.container.getByTestId('@trading/detail/receive-info');
        this.receiveAccount = this.container.getByTestId(
            '@trading/transaction/detail/receive-account',
        );
        this.receiveAssetName = this.container.getByTestId('@trading/detail/receive-asset-name');
        this.receiveNetworkName = this.container.getByTestId(
            '@trading/detail/receive-network-name',
        );
        this.receiveAmount = this.receiveSection.getByTestId('@trading/form/info/crypto-amount');
        this.cryptoAmounts = this.container.getByTestId('@trading/form/info/crypto-amount');
        this.statusCard = page.getByTestId('@trading/transaction/detail/status-card');
        this.providerInStatusCard = this.statusCard.getByTestId('@trading/form/info/provider');
        this.orderIdInStatusCard = this.statusCard.getByTestId(
            '@trading/transaction/detail/order-id',
        );
    }
}
