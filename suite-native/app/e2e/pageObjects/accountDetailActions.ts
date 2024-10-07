import { expect as detoxExpect } from 'detox';

class AccountDetailActions {
    async waitForScreen() {
        await waitFor(element(by.id('@screen/AccountDetail')))
            .toBeVisible()
            .withTimeout(5000);
    }

    async openSettings() {
        await element(by.id('@account-detail/settings-button')).tap();

        await detoxExpect(element(by.id('@screen/AccountSettings'))).toBeVisible();
    }

    async openSend() {
        await element(by.id('@account-detail/send-button')).tap();
    }
}

export const onAccountDetail = new AccountDetailActions();
