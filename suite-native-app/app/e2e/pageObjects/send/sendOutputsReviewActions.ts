import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { waitForVisible } from '../../support/utils';

const sendButton = element(by.id('@send/send-transaction-button'));

class SendOutputsReviewActions {
    async waitForScreen() {
        await waitForVisible(by.id('@screen/SendOutputsReview'));
    }

    async confirmTransactionOutputs() {
        await TrezorUserEnvLink.pressYes();
        await waitForVisible(sendButton);
    }

    async clickSendTransaction() {
        await element(by.id('@screen/mainScrollView')).scrollTo('bottom');
        await waitForVisible(sendButton);
        await sendButton.tap();

        await waitForVisible(by.id('@screen/TransactionDetail'));
    }
}

export const onSendOutputsReview = new SendOutputsReviewActions();
