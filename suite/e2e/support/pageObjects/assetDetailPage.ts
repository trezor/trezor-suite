import { type Locator, type Page } from '@playwright/test';

export class AssetDetailPage {
    readonly backButton: Locator;
    readonly marketPrice: Locator;
    readonly weekChangeAmount: Locator;
    readonly weekChangePercentage: Locator;
    readonly graph: Locator;
    readonly graphLine: Locator;
    readonly graphSkeleton: Locator;
    readonly graphTooltip: Locator;
    readonly graphRange = (range: string) => this.page.getByTestId(`@price-chart/range/${range}`);
    readonly fiatBalance: Locator;
    readonly cryptoBalance: Locator;
    readonly balanceAccountsButton: Locator;
    readonly allocationBar: Locator;
    readonly allocationSegments: Locator;
    readonly availableRow: Locator;
    readonly availableLegendSquare: Locator;
    readonly stakedRow: Locator;
    readonly stakingApy: Locator;
    readonly earnBannerHeading: Locator;
    readonly accountsModal: Locator;
    readonly accountRows: Locator;
    readonly account = (accountType: string, index: number) =>
        this.accountsModal.getByTestId(`@asset-detail/accounts/${accountType}/${index}`);
    readonly transactionAccounts: Locator;
    readonly sendButton: Locator;
    readonly receiveButton: Locator;
    readonly menuButton: Locator;
    readonly menuNetwork: Locator;
    readonly menuContract: Locator;
    readonly unhideModal: Locator;
    readonly cancelUnhide: Locator;
    readonly menuAccounts: Locator;
    readonly menuSignVerify: Locator;
    readonly menuExplorer: Locator;
    readonly menuWalletConnect: Locator;
    readonly menuHideToken: Locator;
    readonly menuShowToken: Locator;

    constructor(private readonly page: Page) {
        this.backButton = page.getByTestId('@asset-detail/back');
        this.marketPrice = page.getByTestId('@asset-detail/market-price/fiat-amount');
        this.weekChangeAmount = page.getByTestId('@asset-detail/market-price/week-change-amount');
        this.weekChangePercentage = page.getByTestId(
            '@asset-detail/market-price/week-change-percentage',
        );
        this.graph = page.getByTestId('@price-chart/graph');
        this.graphLine = this.graph.getByTestId('@price-chart/line');
        this.graphTooltip = this.graph.getByTestId('@price-chart/tooltip');
        this.graphSkeleton = page.getByTestId('@price-chart/skeleton');
        this.fiatBalance = page.getByTestId('@asset-detail/balance/fiat-amount');
        this.cryptoBalance = page.getByTestId('@asset-detail/balance/crypto-amount');
        this.balanceAccountsButton = page.getByTestId('@asset-detail/balance/accounts');
        this.allocationBar = page.getByTestId('@asset-detail/earn/allocation-bar');
        this.allocationSegments = page.getByTestId('@asset-detail/earn/allocation-bar/segment');
        this.availableRow = page.getByTestId('@asset-detail/earn/available');
        this.availableLegendSquare = this.availableRow.getByTestId('@staking-split/legend-square');
        this.stakedRow = page.getByTestId('@asset-detail/earn/staked');
        this.stakingApy = page.getByTestId('@asset-detail/earn/staking-rate');
        this.earnBannerHeading = page.getByTestId('@staking/eth/earn-banner').getByRole('heading');
        this.accountsModal = page.getByTestId('@asset-detail/accounts');
        this.accountRows = this.accountsModal.getByTestId(/^@asset-detail\/accounts\//);
        this.transactionAccounts = page
            .getByTestId('@transactions/multi-account')
            .getByTestId('@wallet/transaction-item')
            .getByTestId('@transaction-item/account')
            .filter({ visible: true });
        this.sendButton = page.getByTestId('@wallet/menu/wallet-global-send');
        this.receiveButton = page.getByTestId('@wallet/menu/wallet-global-receive');
        this.menuButton = page.getByTestId('@asset-detail/menu');
        this.menuContract = page.getByTestId('@asset-detail/menu/contract');
        this.unhideModal = page.getByTestId('@hidden-tokens/unhide');
        this.cancelUnhide = this.unhideModal.getByTestId('@hidden-tokens/unhide/cancel');
        this.menuNetwork = page.getByTestId('@asset-detail/menu/network');
        this.menuAccounts = page.getByTestId('@asset-detail/menu/accounts');
        this.menuSignVerify = page.getByTestId('@asset-detail/menu/sign-verify');
        this.menuExplorer = page.getByTestId('@asset-detail/menu/explorer');
        this.menuWalletConnect = page.getByTestId('@asset-detail/menu/walletconnect');
        this.menuHideToken = page.getByTestId('@asset-detail/menu/hide-token');
        this.menuShowToken = page.getByTestId('@asset-detail/menu/show-token');
    }
}
