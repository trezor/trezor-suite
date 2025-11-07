import { wait } from '../../support/utils';

export class TradingActions {
    readonly DOUBLE_LONG_TIMEOUT = 60_000;
    readonly LONG_TIMEOUT = 30_000;
    readonly SHORT_TIMEOUT = 5_000;
    readonly BOTTOM_SHEET_ANIMATION_DURATION = 1_000;

    readonly testIdPrefix: string;

    constructor(
        screenPrefix:
            | 'buy'
            | 'sell'
            | 'exchange'
            | 'history'
            | 'exchange-preview'
            | 'exchange-fees'
            | 'outputs-review',
    ) {
        this.testIdPrefix = `@trading/${screenPrefix}/`;
    }

    getTestId(suffix: string) {
        return this.testIdPrefix + suffix;
    }

    getElementById(suffix: string) {
        return element(by.id(this.getTestId(suffix)));
    }

    async closeBottomSheet() {
        await element(by.id('@bottom-sheet/header/close-button')).tap();
        await wait(this.BOTTOM_SHEET_ANIMATION_DURATION);
    }
}
