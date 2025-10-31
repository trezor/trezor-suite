import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { waitForVisible } from '../../support/utils';

const sendButton = element(by.id('@send/send-transaction-button'));

class SendOutputsReviewActions {
    async waitForScreen() {
        await waitForVisible(by.id('@screen/SendOutputsReview'));
    }

    async confirmTransactionOutputs() {
        let isTransactionReviewInProgress = true;
        do {
            await TrezorUserEnvLink.pressYes();

            try {
                await waitForVisible(sendButton);
                isTransactionReviewInProgress = false;
            } catch {
                // continue loop, there are more outputs to review
            }
        } while (isTransactionReviewInProgress);
    }

    async clickSendTransaction() {
        await waitForVisible(sendButton);
        await sendButton.tap();

        await waitForVisible(by.id('@screen/TransactionDetail'));
    }
}

export const onSendOutputsReview = new SendOutputsReviewActions();
