import { expect as detoxExpect } from 'detox';

import { onTabBar } from './tabBarActions';
import { inputTextToElement, scrollUntilVisible, waitForVisible } from '../support/utils';

class AccountImportActions {
    async importAccountAndVerifyVisibility({
        networkSymbol,
        xpub,
        accountName,
    }: {
        networkSymbol: string;
        xpub: string;
        accountName: string;
    }) {
        await this.selectCoin({ networkSymbol });
        await this.submitXpub({ xpub, isValid: true });
        await this.setAccountName({ accountName });
        await this.confirmAddAccount();
        await onTabBar.navigateToMyAssets();

        // after importing some accounts, not all are visible, scrolling might be needed
        await scrollUntilVisible(element(by.text(accountName)));
    }

    async selectCoin({ networkSymbol }: { networkSymbol: string }) {
        // not all coin types are visible, so first check if visible, if not, scroll
        const coinItemElement = element(
            by.id(`@onboarding/select-coin/${networkSymbol.toLowerCase()}`),
        );
        await scrollUntilVisible(coinItemElement);
        await coinItemElement.tap();
        await detoxExpect(element(by.id('@screen/XpubScan'))).toBeVisible();
    }

    async submitXpub({ xpub, isValid }: { xpub: string; isValid: boolean }) {
        const xpubInput = element(by.id('@accounts-import/sync-coins/xpub-input'));
        await inputTextToElement(xpubInput, xpub);

        const xpubSubmitButton = element(by.id('@accounts-import/sync-coins/xpub-submit'));
        await scrollUntilVisible(xpubSubmitButton);
        await xpubSubmitButton.tap();

        if (isValid) {
            await waitForVisible(by.id('@screen/AccountImportSummary'));
        }
    }

    async setAccountName({ accountName }: { accountName: string }) {
        const accountNameInput = element(by.id('@account-import/coin-synced/label-input'));
        await accountNameInput.clearText();
        await accountNameInput.typeText(accountName);
    }

    async confirmAddAccount() {
        const confirmButton = element(by.id('@account-import/coin-synced/confirm-button'));
        await scrollUntilVisible(confirmButton);
        await confirmButton.tap();
        await detoxExpect(element(by.id('@screen/Accounts'))).toBeVisible();
    }
}

export const onAccountImport = new AccountImportActions();
