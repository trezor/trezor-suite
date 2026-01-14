import { expect as detoxExpect } from 'detox';

import { waitForVisible } from '../support/utils';

class AccountReceiveActions {
    async waitForScreen() {
        await waitForVisible(by.id('@screen/ReceiveAccount'));
    }

    async tapShowAddressButton() {
        const showAddressButton = element(by.id('@receive/show-address-button'));

        await waitForVisible(showAddressButton);
        await showAddressButton.tap();

        // button should be hidden after tap
        await waitFor(showAddressButton).not.toBeVisible().withTimeout(30000);
    }

    async verifyReceiveAddress(address: string) {
        const receiveAddressText = element(by.id('@receive/confirmed-receive-address'));

        await waitForVisible(receiveAddressText);
        await detoxExpect(receiveAddressText).toHaveText(address);
    }

    async verifyReceiveAddressLabel(label: string) {
        const receiveAddressLabel = element(by.id('@receive/address-label/text'));

        await waitForVisible(receiveAddressLabel);
        await detoxExpect(receiveAddressLabel).toHaveText(label);
    }
}

export const onAccountReceive = new AccountReceiveActions();
