class AccountDetailActions {
    async tapSettingsButton() {
        await element(by.id('@account-detail/settings-button')).tap();
    }
}

export const onAccountDetail = new AccountDetailActions();
