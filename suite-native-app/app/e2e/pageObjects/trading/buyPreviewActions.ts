import { TradingActions } from './TradingActions';
import { waitForVisible } from '../../support/utils';

class BuyPreviewActions extends TradingActions {
    constructor() {
        super('buy-preview');
    }

    getScreen() {
        return element(by.id('@screen/TradingBuyPreview'));
    }

    async expectBuyPreviewScreenToBeVisible() {
        await waitForVisible(this.getScreen());
    }

    async confirmTrade() {
        await this.getElementById('continue-button').tap();
    }
}

export const buyPreviewActions = new BuyPreviewActions();
