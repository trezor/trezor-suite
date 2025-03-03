import { expect as detoxExpect } from 'detox';

class AccountReceiveActions {
    async waitForScreen() {
        await waitFor(element(by.id('@screen/ReceiveAccount'))).toBeVisible();
    }

    async tapShowAddressButton() {
        const showAddressButton = element(by.id('@receive/show-address-button'));

        await waitFor(showAddressButton).toBeVisible().withTimeout(30000);
        await showAddressButton.tap();

        // button should be hidden after tap
        await waitFor(showAddressButton).not.toBeVisible().withTimeout(30000);
    }

    async verifyReceiveAddress(address: string) {
        const receiveAddressText = element(by.id('@receive/confirmed-receive-address'));

        await waitFor(receiveAddressText).toBeVisible().withTimeout(30000);
        detoxExpect(receiveAddressText).toHaveText(address);
    }
}

export const onAccountReceive = new AccountReceiveActions();
