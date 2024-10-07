import { expect as detoxExpect } from 'detox';

class SendAddressReviewActions {
    async nextStep() {
        await detoxExpect(element(by.id('@screen/SendAddressReview'))).toBeVisible();
        await element(by.id('@send/address-review-continue')).tap();
    }
}

export const onSendAddressReview = new SendAddressReviewActions();
