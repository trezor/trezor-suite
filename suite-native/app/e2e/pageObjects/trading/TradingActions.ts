import { scrollUntilVisible, wait } from '../../support/utils';

export class TradingActions {
    readonly DOUBLE_LONG_TIMEOUT = 60_000;
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
            | 'outputs-review'
            | 'sell-preview'
            | 'sell-fees',
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
        await this.waitForBottomSheetAnimation();
    }

    waitForBottomSheetAnimation() {
        return wait(this.BOTTOM_SHEET_ANIMATION_DURATION);
    }

    async scrollScreenToBottom() {
        await element(by.id('@screen/mainScrollView')).scrollTo('bottom');
    }

    async scrollToLearnMoreLink() {
        // Scroll to bottom of the page.
        // `scrollScreenToBottom` is not used because it accidentally clicks on links at the bottom on iOS.
        const learnMoreLink = element(by.text('Learn more'));
        await scrollUntilVisible(learnMoreLink);
    }
}
