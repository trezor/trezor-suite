import { type Locator, type Page } from '@playwright/test';

import { step } from '../common';
import { expect } from '../testExtends/customMatchers';

const readBackgroundColor = (locator: Locator) =>
    locator.evaluate(element => {
        // Read the color after the browser applies the current theme.
        const style = window.getComputedStyle(element);

        return style.backgroundColor;
    });

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
        this.availableLegendSquare = this.availableRow.getByTestId(
            '@asset-detail/earn/legend-square',
        );
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

    @step()
    async expectAvailableSegmentToFillBar() {
        await expect(this.allocationSegments).toBeVisible();

        const legendColor = await readBackgroundColor(this.availableLegendSquare);
        await expect(this.allocationSegments).toHaveCSS('background-color', legendColor);

        const barWidth = await this.allocationBar.evaluate(bar => bar.clientWidth);
        await expect(this.allocationSegments).toHaveJSProperty('clientWidth', barWidth);
    }

    @step()
    async expectGraphRendered() {
        await expect(this.graphLine).toBeVisible({ timeout: 30_000 });
        await expect(this.graphSkeleton).toBeHidden();

        // A solid line has no dash pattern; an animated line finishes with a zero-pixel gap.
        const fullyDrawnStroke = /^(none|.+, 0px)$/;
        await expect(this.graphLine).toHaveCSS('stroke-dasharray', fullyDrawnStroke);
    }

    private async readTooltipTimestamp(x: number) {
        await this.graph.hover({ position: { x, y: 50 } });
        await expect(this.graphTooltip).toBeVisible();

        // The tooltip displays the price followed by the local date and time.
        const tooltipText = await this.graphTooltip.innerText();
        const dateText = tooltipText.split('\n').at(-1) ?? '';

        return Date.parse(dateText.replaceAll('\u202f', ' '));
    }

    @step()
    async expectGraphTimeSpan(minDays: number, maxDays?: number) {
        const width = await this.graph.evaluate(graph => graph.clientWidth);

        await expect(async () => {
            const start = await this.readTooltipTimestamp(1);
            const end = await this.readTooltipTimestamp(width - 1);
            const daysShown = (end - start) / (24 * 60 * 60 * 1000);

            expect(daysShown, 'Days between the first and last tooltip').toBeGreaterThanOrEqual(
                minDays,
            );
            if (maxDays !== undefined) {
                expect(daysShown, 'Days between the first and last tooltip').toBeLessThanOrEqual(
                    maxDays,
                );
            }
        }).toPass({ timeout: 10_000 });
    }
}
