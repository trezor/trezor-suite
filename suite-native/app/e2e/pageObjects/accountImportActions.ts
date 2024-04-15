import { scrollUntilVisible } from '../utils';

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
        // not all coin types are visible, so first check if visible, if not, scroll
        await scrollUntilVisible(by.id(`@onboarding/select-coin/${networkSymbol.toLowerCase()}`));

        await element(by.id(`@onboarding/select-coin/${networkSymbol.toLowerCase()}`)).tap();
        await element(by.id('@accounts-import/sync-coins/xpub-input')).replaceText(xpub);

        // Submit button is not visible without scrolling
        await element(by.id('@screen/mainScrollView')).scrollTo('bottom');
        await element(by.id('@accounts-import/sync-coins/xpub-submit')).tap();

        await waitFor(element(by.id('@account-import/coin-synced/success-pictogram')))
            .toBeVisible()
            .withTimeout(20000); // it may take a while to load data from blockchain

        await element(by.id('@account-import/coin-synced/label-input')).replaceText(accountName);
        // confirm button is not visible for some coins e.g. eth
        await element(by.id('@screen/mainScrollView')).scrollTo('bottom');
        await element(by.id('@account-import/coin-synced/confirm-button')).tap();

        await element(by.id('@tabBar/AccountsStack')).tap();

        // after importing some accounts, not all are visible, scrolling might be needed
        await scrollUntilVisible(by.text(accountName));
    }
}

export const onAccountImport = new AccountImportActions();
