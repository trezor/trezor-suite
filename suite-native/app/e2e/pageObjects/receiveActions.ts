import { expect as detoxExpect } from 'detox';

class ReceiveActions {
    async showAddress() {
        const showAddressBtn = element(by.id('@receive/showAddressButton'));
        await waitFor(showAddressBtn).toBeVisible().withTimeout(20000);
        await showAddressBtn.tap();
        await detoxExpect(element(by.id('@receiveAddress/addressValue'))).toBeVisible();
    }
}

export const onReceiveScreen = new ReceiveActions();
