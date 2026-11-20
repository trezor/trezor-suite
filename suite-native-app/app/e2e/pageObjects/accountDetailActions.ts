import { expect as detoxExpect } from 'detox';

import { waitForVisible } from '../support/utils';

class AccountDetailActions {
    async waitForScreen() {
        await waitForVisible(by.id('@screen/AccountDetail'));
    }

    async openSettings() {
        await element(by.id('@account-detail/settings-button')).tap();

        await detoxExpect(element(by.id('@screen/AccountSettings'))).toBeVisible();
    }

    async openSend() {
        await element(by.id('@account-detail/send-button')).tap();
    }

    async openReceive() {
        const receiveButton = element(by.id('@account-detail/receive-button'));
        await waitForVisible(receiveButton);
        await receiveButton.tap();
    }
}

export const onAccountDetail = new AccountDetailActions();
