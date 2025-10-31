import { TradingActions } from './TradingActions';
import { waitForVisible } from '../../support/utils';

class ExchangePreviewActions extends TradingActions {
    constructor() {
        super('exchange-preview');
    }

    getScreen() {
        return element(by.id('@screen/TradingExchangePreview'));
    }

    async expectExchangePreviewScreenToBeVisible() {
        await waitForVisible(this.getScreen());
    }

    async waitForFeesToLoad() {
        await waitForVisible(
            element(by.text('≈').withAncestor(by.id('@trading/fees/fee-picker'))),
            { timeout: this.DOUBLE_LONG_TIMEOUT },
        );
    }

    async goToFees() {
        await element(by.id('@trading/fees/fee-picker')).tap();
    }

    async goToTransactionSigning() {
        await this.getElementById('continue-button').tap();
    }
}

export const exchangePreviewActions = new ExchangePreviewActions();
