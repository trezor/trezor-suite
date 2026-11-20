import { type Locator, type Page } from '@playwright/test';

import { step } from '../common';
import { type WalletPage } from './walletPage';
import { expect } from '../testExtends/customMatchers';

const STELLAR_NETWORK_NAME = 'Stellar';
const TRUSTLINE_RESERVE = '0.5 XLM';

export class StellarTokensSection {
    readonly tokensTab: Locator;
    readonly inactiveTab: Locator;
    readonly searchInput: Locator;
    readonly zeroBalanceToggle: Locator;
    readonly description: Locator;
    readonly continueButton: Locator;
    readonly deactivateButton: Locator;
    readonly activatedToast: Locator;
    readonly deactivatedToast: Locator;
    readonly activateButton = (assetCode: string): Locator =>
        this.page.getByTestId(`@token/activate-${assetCode}`);
    readonly tokenRow = (symbol: string): Locator => this.walletPage.tokenRow(symbol);

    constructor(
        private readonly page: Page,
        private readonly walletPage: WalletPage,
    ) {
        this.tokensTab = this.page.getByTestId('@wallet/menu/wallet-tokens');
        this.inactiveTab = this.page.getByTestId('@wallet/tokens/inactive');
        // The test id sits on the <input> itself; the Input wrapper does not carry it.
        this.searchInput = this.page.getByTestId('@wallet/accounts/search-icon');
        this.zeroBalanceToggle = this.page.getByTestId('@wallet/tokens/zero-balance-toggle');
        this.description = this.page.getByTestId('@wallet/stellar-token/description');
        this.continueButton = this.page.getByTestId('@wallet/stellar-token/continue');
        this.deactivateButton = this.page.getByTestId('@wallet/stellar-token/deactivate');
        this.activatedToast = this.page.getByTestId('@toast/activate-token-success');
        this.deactivatedToast = this.page.getByTestId('@toast/deactivate-token-success');
    }

    @step()
    async openTokensTab() {
        await this.tokensTab.click();
    }

    // Trustlines without a balance are listed in a collapsed group.
    @step()
    async showTokenRow(symbol: string, options?: { timeout?: number }) {
        const row = this.tokenRow(symbol);

        await expect(row.or(this.zeroBalanceToggle).first()).toBeVisible(options);
        if (!(await row.isVisible())) {
            await this.zeroBalanceToggle.click();
        }
        await expect(row).toBeVisible();
    }

    @step()
    async openInactiveTab() {
        await this.inactiveTab.click();
    }

    @step()
    async search(query: string) {
        await this.searchInput.fill(query);
    }

    @step()
    async startActivation(assetCode: string) {
        await this.activateButton(assetCode).click();
        await expect(this.description).toBeVisible();
    }

    @step()
    async expectActivationDescribesReserve(token: string) {
        await expect(this.description).toHaveTranslation('TR_TOKEN_ACTIVATION_DESCRIPTION', {
            values: {
                token,
                network: STELLAR_NETWORK_NAME,
                reserve: TRUSTLINE_RESERVE,
            },
        });
    }

    @step()
    async continueTrustline() {
        await this.continueButton.click();
    }

    @step()
    async openDeactivate(symbol: string) {
        await this.walletPage.tokenRowMoreButton(symbol).click();
        await this.deactivateButton.click();
        await expect(this.description).toBeVisible();
    }

    @step()
    async expectDeactivationReturnsReserve() {
        await expect(this.description).toHaveTranslation('TR_TOKEN_DEACTIVATION_DESCRIPTION');
    }
}
