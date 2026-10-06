import { TradingActions } from './TradingActions';
import { waitForVisible, waitToHaveRegex } from '../../support/utils';

class SellCompletionActions extends TradingActions {
    constructor() {
        super('sell-completion');
    }

    getScreen() {
        return element(by.id('@screen/TradingSellCompletion'));
    }

    async expectSellCompletionScreenToBeVisible() {
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
        await this.getElementById('confirm-button').tap();
    }

    async expectConfirmationInProgress() {
        await waitForVisible(this.getElementById('provider-confirmation-in-progress'), {
            timeout: this.SHORT_TIMEOUT,
        });
    }

    async expectConfirmationToFail() {
        await waitForVisible(this.getElementById('provider-confirmation-failed'), {
            timeout: this.DOUBLE_LONG_TIMEOUT,
        });
    }
}

export const sellCompletionActions = new SellCompletionActions();
