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
        await waitFor(element(by.id('@toastWrap')))
            .toBeVisible()
            .withTimeout(20000);
    }
}

export const onReceiveScreen = new ReceiveActions();
