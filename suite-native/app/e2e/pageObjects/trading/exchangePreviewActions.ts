import { TradingActions } from './TradingActions';
import { waitForVisible, waitToHaveRegex } from '../../support/utils';

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
        await waitToHaveRegex(
            by.id('@transactionManagement/fee-crypto-amount'),
            /\d[\d.]*\s[A-Z]{2,6}/,
            { timeout: this.DOUBLE_LONG_TIMEOUT },
        );
    }

    async goToTransactionSigning() {
        await this.getElementById('continue-button').tap();
    }
}

export const exchangePreviewActions = new ExchangePreviewActions();
