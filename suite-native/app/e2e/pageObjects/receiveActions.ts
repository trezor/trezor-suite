import { expect as detoxExpect } from 'detox';

class ReceiveActions {
    async showAddress() {
        const showAddressBtn = element(by.id('@receive/showAddress'));
        await waitFor(showAddressBtn).toBeVisible().withTimeout(20000);
        await showAddressBtn.tap();
        await detoxExpect(element(by.id('@receiveAddress/addressValue'))).toBeVisible();
    }

    async copyAddress() {
        const copyAddressBtn = element(by.id('@receiveAddress/copy'));
        await waitFor(copyAddressBtn).toBeVisible().withTimeout(20000);
        await copyAddressBtn.tap();
        await detoxExpect(element(by.id('@toastWrap'))).toBeVisible();
    }
}

export const onReceiveScreen = new ReceiveActions();
