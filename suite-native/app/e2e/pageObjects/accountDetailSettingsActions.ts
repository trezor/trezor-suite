class AccountDetailSettingsActions {
    async renameAccount({ newAccountName }: { newAccountName: string }) {
        await element(by.id('@account-detail/settings/edit-button')).tap();

        const accountNameInput = element(by.id('@account-detail/settings/account-rename/input'));
        await accountNameInput.clearText();
        await accountNameInput.typeText(newAccountName);

        await element(by.id('@account-detail/settings/account-rename/confirm-button')).tap();
    }

    async removeAccount() {
        await element(by.id('@account-detail/settings/remove-coin-button')).tap();
        await element(by.id('@alert-sheet/primary-button')).tap();
    }
}

export const onAccountDetailSettings = new AccountDetailSettingsActions();
