import { expect as detoxExpect } from 'detox';

class AccountDetailActions {
    async openSettings() {
        await element(by.id('@account-detail/settings-button')).tap();

        await detoxExpect(element(by.id('@screen/AccountSettings'))).toBeVisible();
    }
}

export const onAccountDetail = new AccountDetailActions();
