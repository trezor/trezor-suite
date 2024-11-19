import { FeeLevelLabel } from '@suite-common/wallet-types';

export type FeeValues =
    | { feeType: Exclude<FeeLevelLabel, 'custom'>; customFeePerUnit?: never }
    | { feeType: 'custom'; customFeePerUnit: string };
class SendFeesActions {
    async waitForScreen() {
        await waitFor(element(by.id('@screen/SendFees')))
            .toBeVisible()
            .withTimeout(5000);
    }

    async setCustomFee(customFeePerUnit: string) {
        await element(by.id('@send/fees-level-custom')).tap();
        await waitFor(element(by.id('@send/custom-fee-bottom-sheet')))
            .toBeVisible()
            .withTimeout(5000);
        await element(by.id(`@send/customFeePerUnit-input`)).replaceText(customFeePerUnit);

        const submitButton = element(by.id('@send/custom-fee-submit-button'));
        await waitFor(submitButton).toBeVisible().withTimeout(5000);
        await submitButton.tap();
    }
    async selectFee({ feeType, customFeePerUnit }: FeeValues) {
        await this.waitForScreen();

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
            case 'custom':
                await this.setCustomFee(customFeePerUnit);
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
