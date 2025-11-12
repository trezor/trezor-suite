import { FeeLevelLabel } from '@suite-common/wallet-types';

import { waitForVisible } from '../../support/utils';

export type FeeValues =
    | { feeType: Exclude<FeeLevelLabel, 'custom'>; customFeePerUnit?: never }
    | { feeType: 'custom'; customFeePerUnit: string };
class SendFeesActions {
    async waitForScreen() {
        await waitForVisible(by.id('@screen/SendFees'));
    }

    async setCustomFee(customFeePerUnit: string) {
        await element(by.id('@transactionManagement/fees-level-custom')).tap();
        await waitForVisible(by.id('@transactionManagement/custom-fee-bottom-sheet'));
        await element(by.id(`@transactionManagement/customFeePerUnit-input`)).replaceText(
            customFeePerUnit,
        );

        const submitButton = element(by.id('@transactionManagement/custom-fee-submit-button'));
        await waitForVisible(submitButton);
        await submitButton.tap();
    }
    async selectFee({ feeType, customFeePerUnit }: FeeValues) {
        await this.waitForScreen();

        if (feeType === 'custom') {
            await this.setCustomFee(customFeePerUnit);
        } else {
            await element(by.id(`@transactionManagement/fees-level-radio-${feeType}`)).tap();
        }
    }

    async submitFee() {
        await element(by.id('@transactionManagement/fees-submit-button')).tap();
    }
}

export const onSendFees = new SendFeesActions();
