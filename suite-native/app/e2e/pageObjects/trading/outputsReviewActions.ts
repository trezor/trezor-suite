import { expect as detoxExpect } from 'detox';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { TradingActions } from './TradingActions';
import { waitForVisible } from '../../support/utils';

class OutputsReviewActions extends TradingActions {
    constructor(private readonly screenName: string) {
        super('outputs-review');
    }

    getScreen() {
        return element(by.id(`@screen/${this.screenName}`));
    }

    async expectOutputsReviewScreenToBeVisible() {
        await waitForVisible(this.getScreen());
    }

    async expectAndConfirmRecipientAddress() {
        await waitForVisible(by.text('Recipient address'), { timeout: this.DOUBLE_LONG_TIMEOUT });
        await TrezorUserEnvLink.pressYes();
    }

    async expectConnectTrezorInfo() {
        await waitForVisible(by.text('Connect & unlock\nyour Trezor'), {
            timeout: this.SHORT_TIMEOUT,
        });
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

    async cancelConnectTrezorInfo() {
        await element(by.id('@connect-device/header/close')).tap();
    }
}

export const exchangeOutputsReviewActions = new OutputsReviewActions(
    'TradingExchangeOutputsReview',
);

export const sellOutputsReviewActions = new OutputsReviewActions('TradingSellOutputsReview');
