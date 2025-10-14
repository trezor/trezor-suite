import { TradingActions } from './TradingActions';

class ExchangePreviewActions extends TradingActions {
    constructor() {
        super('exchange-preview');
    }

    getScreen() {
        return element(by.id('@screen/TradingExchangePreview'));
    }

    async expectExchangePreviewScreenToBeVisible() {
        await waitFor(this.getScreen()).toBeVisible().withTimeout(this.SHORT_TIMEOUT);
    }

    async waitForFeesToLoad() {
        await waitFor(element(by.text('≈').withAncestor(by.id('@trading/fees/fee-picker'))))
            .toBeVisible()
            .withTimeout(this.DOUBLE_LONG_TIMEOUT);
    }

    async goToFees() {
        await element(by.id('@trading/fees/fee-picker')).tap();
    }

    async goToTransactionSigning() {
        await this.getElementById('continue-button').tap();
    }
}

export const exchangePreviewActions = new ExchangePreviewActions();
