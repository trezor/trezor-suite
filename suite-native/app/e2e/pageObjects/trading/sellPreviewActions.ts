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

    async continueToProvider() {
        await this.getElementById('continue-button').tap();
    }
}

export const sellPreviewActions = new SellPreviewActions();
