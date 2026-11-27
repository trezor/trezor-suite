import { TradingActions } from './TradingActions';
import { waitForEnabled, waitForVisible, waitToHaveRegex } from '../../support/utils';

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
        await waitToHaveRegex(by.id('@transactionManagement/fee-base-amount'), /\d/, {
            timeout: this.DOUBLE_LONG_TIMEOUT,
        });
    }

    async goToTransactionSigning() {
        const button = this.getElementById('continue-button');
        await waitForEnabled(button, { timeout: this.DOUBLE_LONG_TIMEOUT });
        await button.tap();
    }
}

export const exchangePreviewActions = new ExchangePreviewActions();
