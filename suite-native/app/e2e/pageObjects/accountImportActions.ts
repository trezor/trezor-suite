import { expect as detoxExpect } from 'detox';

import { scrollUntilVisible } from '../utils';
import { onTabBar } from './tabBarActions';

class AccountImportActions {
    async importAccount({
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
        await scrollUntilVisible(by.text(accountName));
    }

    async selectCoin({ networkSymbol }: { networkSymbol: string }) {
        // not all coin types are visible, so first check if visible, if not, scroll
        await scrollUntilVisible(by.id(`@onboarding/select-coin/${networkSymbol.toLowerCase()}`));
        await element(by.id(`@onboarding/select-coin/${networkSymbol.toLowerCase()}`)).tap();
        await detoxExpect(element(by.id('`@screen/XpubScan`')));
    }

    async submitXpub({ xpub, isValid }: { xpub: string; isValid: boolean }) {
        await element(by.id('@accounts-import/sync-coins/xpub-input')).replaceText(xpub);

        // Submit button is not visible without scrolling
        await element(by.id('@screen/mainScrollView')).scrollTo('bottom');
        await element(by.id('@accounts-import/sync-coins/xpub-submit')).tap();

        if (isValid) {
            await waitFor(element(by.id('@screen/AccountImportSummary')))
                .toBeVisible()
                .withTimeout(20000); // it may take a while to load data from blockchain
        }
    }

    async setAccountName({ accountName }: { accountName: string }) {
        await element(by.id('@account-import/coin-synced/label-input')).replaceText(accountName);
    }

    async confirmAddAccount() {
        // confirm button is not visible for some coins e.g. eth
        await element(by.id('@screen/mainScrollView')).scrollTo('bottom');
        await element(by.id('@account-import/coin-synced/confirm-button')).tap();

        await detoxExpect(element(by.id('@screen/Home')));
    }
}

export const onAccountImport = new AccountImportActions();
