import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

const sendButton = element(by.id('@send/send-transaction-button'));

class SendOutputsReviewActions {
    async waitForScreen() {
        await waitFor(element(by.id('@screen/SendOutputsReview')))
            .toBeVisible()
            .withTimeout(3000);
    }

    async confirmTransactionOutputs() {
        let isReviewInProgress = true;
        do {
            await TrezorUserEnvLink.pressYes();

            try {
                await waitFor(sendButton).toBeVisible().withTimeout(3000);
                isReviewInProgress = false;
            } catch {
                // continue loop, there are more outputs to review
            }
        } while (isReviewInProgress);
    }

    async clickSendTransaction() {
        await waitFor(sendButton).toBeVisible().withTimeout(15000);
        await sendButton.tap();

        await waitFor(element(by.id('@screen/TransactionDetail')))
            .toBeVisible()
            .withTimeout(3000);
    }
}

export const onSendOutputsReview = new SendOutputsReviewActions();
