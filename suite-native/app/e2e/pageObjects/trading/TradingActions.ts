export class TradingActions {
    readonly LONG_TIMEOUT = 30000;
    readonly SHORT_TIMEOUT = 5000;
    readonly SEARCH_AND_ANIMATION_TIMEOUT = 1000;

    readonly testIdPrefix: string;

    constructor(tradeType: 'buy' | 'sell' | 'exchange' | 'history') {
        this.testIdPrefix = `@trading/${tradeType}/`;
    }

    getTestId(suffix: string) {
        return this.testIdPrefix + suffix;
    }

    getElementById(suffix: string) {
        return element(by.id(this.getTestId(suffix)));
    }
}
