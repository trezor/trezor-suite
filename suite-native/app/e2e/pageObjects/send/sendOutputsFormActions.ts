import { expect as detoxExpect } from 'detox';

import { waitForVisible } from '../../support/utils';

class SendOutputsFormActions {
    async waitForScreen() {
        await waitForVisible(by.id('@screen/SendOutputs'));
    }

    async fillForm(values: { address?: string; amount?: string }[]) {
        await detoxExpect(element(by.id(`@screen/SendOutputs`))).toBeVisible();

        for (const [index, value] of values.entries()) {
            const { address, amount } = value;
            if (address) {
                await element(by.id(`outputs.${index}.address`)).typeText(address);
                // Dismiss keyboard so it doesn't cover the amount input below.
                await device.pressBack();
            }
            if (amount) {
                await element(by.id(`outputs.${index}.amount`)).typeText(amount);
            }
        }
    }

    async clearForm() {
        await element(by.id(/^outputs\.\d+\.address$/)).clearText();
        await element(by.id(/^outputs\.\d+\.amount$/)).clearText();
    }

    async submitForm() {
        await element(by.id('@send/form-submit-button')).tap();
    }
}

export const onSendOutputsForm = new SendOutputsFormActions();
