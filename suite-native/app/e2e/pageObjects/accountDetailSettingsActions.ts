import { waitForVisible } from '../support/utils';
class AccountDetailSettingsActions {
    async renameAccount({ newAccountName }: { newAccountName: string }) {
        await element(by.id('@account-detail/settings/edit-button')).tap();

        const accountNameInput = element(by.id('@account-detail/settings/account-rename/input'));
        await accountNameInput.replaceText(newAccountName);

        const confirmButton = element(
            by.id('@account-detail/settings/account-rename/confirm-button'),
        );
        await waitForVisible(confirmButton);
        await confirmButton.tap();
    }

    async removeAccount() {
        await element(by.id('@account-detail/settings/remove-coin-button')).tap();
        await element(by.id('@alert-sheet/primary-button')).tap();
    }
}

export const onAccountDetailSettings = new AccountDetailSettingsActions();
