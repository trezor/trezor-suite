import { expect as detoxExpect } from 'detox';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { TradingActions } from './TradingActions';
import { waitForVisible } from '../../support/utils';

class OutputsReviewActions extends TradingActions {
    constructor() {
        super('outputs-review');
    }

    getScreen() {
        return element(by.id('@screen/TradingOutputsReview'));
    }

    async expectOutputsReviewScreenToBeVisible() {
        await waitForVisible(this.getScreen());
    }

    async expectAndConfirmRecipientAddress() {
        await waitForVisible(by.text('Recipient address'), { timeout: this.DOUBLE_LONG_TIMEOUT });
        await TrezorUserEnvLink.pressYes();
    }

    async expectAndConfirmTotalFee() {
        await waitForVisible(by.text('Total including fee'));
        await detoxExpect(element(by.text('Amount'))).toBeVisible();
        await detoxExpect(element(by.text('Maximum fee'))).toBeVisible();
        await TrezorUserEnvLink.pressYes();
    }

    async signTransaction() {
        await TrezorUserEnvLink.pressYes();
    }

    async expectSendTransactionButton() {
        await waitForVisible(this.getElementById('footer/submit-button'));
    }

    async cancelTransaction() {
        // for some reason we can have 2 back buttons in this screen
        await element(by.id('@screen/sub-header/go-back-button')).atIndex(0).tap();
        await element(by.text('Cancel')).tap();
    }
}

export const outputsReviewActions = new OutputsReviewActions();
