import { expect as detoxExpect } from 'detox';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { TradingActions } from './TradingActions';

class OutputsReviewActions extends TradingActions {
    constructor() {
        super('outputs-review');
    }

    getScreen() {
        return element(by.id('@screen/TradingOutputsReview'));
    }

    async expectOutputsReviewScreenToBeVisible() {
        await waitFor(this.getScreen()).toBeVisible().withTimeout(this.SHORT_TIMEOUT);
    }

    async expectAndConfirmRecipientAddress() {
        await waitFor(element(by.text('Recipient address')))
            .toBeVisible()
            .withTimeout(this.DOUBLE_LONG_TIMEOUT);
        await TrezorUserEnvLink.pressYes();
    }

    async expectAndConfirmTotalFee() {
        await waitFor(element(by.text('Total including fee')))
            .toBeVisible()
            .withTimeout(this.SHORT_TIMEOUT);
        await detoxExpect(element(by.text('Amount'))).toBeVisible();
        await detoxExpect(element(by.text('Maximum fee'))).toBeVisible();
        await TrezorUserEnvLink.pressYes();
    }

    async signTransaction() {
        await TrezorUserEnvLink.pressYes();
    }

    async expectSendTransactionButton() {
        await waitFor(this.getElementById('footer/submit-button'))
            .toBeVisible()
            .withTimeout(this.SHORT_TIMEOUT);
    }

    async cancelTransaction() {
        // for some reason we can have 2 back buttons in this screen
        await element(by.id('@screen/sub-header/go-back-button')).atIndex(0).tap();
        await element(by.text('Cancel')).tap();
    }
}

export const outputsReviewActions = new OutputsReviewActions();
