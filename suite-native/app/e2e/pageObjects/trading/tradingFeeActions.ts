import { TradingActions } from './TradingActions';
import { waitForVisible } from '../../support/utils';

class TradingFeeActions extends TradingActions {
    constructor() {
        super('exchange-fees');
    }

    getScreen() {
        return element(by.id('@screen/TradingFees'));
    }

    async expectFeesScreenToBeVisible() {
        await waitForVisible(this.getScreen());
    }

    async goBack() {
        await element(by.id('@screen/sub-header/go-back-button')).tap();
    }
}

export const tradingFeeActions = new TradingFeeActions();
