import { TradingActions } from './TradingActions';
import { waitForVisible } from '../../support/utils';

class SellPreviewActions extends TradingActions {
    constructor() {
        super('sell-preview');
    }

    getScreen() {
        return element(by.id('@screen/TradingSellPreview'));
    }

    async expectSellPreviewScreenToBeVisible() {
        await waitForVisible(this.getScreen());
    }

    async waitForFeesToLoad() {
        await waitForVisible(
            element(by.text('≈').withAncestor(by.id('@transactionManagement/fee-selector-card'))),
            { timeout: this.DOUBLE_LONG_TIMEOUT },
        );
    }

    async goToTransactionSigning() {
        await this.getElementById('continue-button').tap();
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

export const sellPreviewActions = new SellPreviewActions();
