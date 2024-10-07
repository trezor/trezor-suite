import { expect as detoxExpect } from 'detox';

import { FeeLevelLabel } from '@suite-common/wallet-types';

class SendFeesActions {
    async waitForScreen() {
        await waitFor(element(by.id('@screen/SendFees')))
            .toBeVisible()
            .withTimeout(5000);
    }

    async selectFee(feeType: FeeLevelLabel) {
        await detoxExpect(element(by.id('@screen/SendFees'))).toBeVisible();

        switch (feeType) {
            case 'low':
                await element(by.id('@send/fees-level-low')).tap();
                break;
            case 'normal':
                await element(by.id('@send/fees-level-normal')).tap();
                break;
            case 'high':
                await element(by.id('@send/fees-level-high')).tap();
                break;
            default:
                throw new Error(`SendFeesActions.selectFee(): Unsupported fee type: ${feeType}`);
        }
    }

    async submitFee() {
        await element(by.id('@send/fees-submit-button')).tap();
    }
}

export const onSendFees = new SendFeesActions();
