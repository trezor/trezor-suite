import { TradingActions } from './TradingActions';

class TradingFeeActions extends TradingActions {
    constructor() {
        super('exchange-fees');
    }

    getScreen() {
        return element(by.id('@screen/TradingFees'));
    }

    async expectFeesScreenToBeVisible() {
        await waitFor(this.getScreen()).toBeVisible().withTimeout(this.SHORT_TIMEOUT);
    }

    async goBack() {
        await element(by.id('@screen/sub-header/go-back-button')).tap();
    }
}

export const tradingFeeActions = new TradingFeeActions();
