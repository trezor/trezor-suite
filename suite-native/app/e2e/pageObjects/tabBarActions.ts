import { expect as detoxExpect } from 'detox';

class TabBarActions {
    async navigateToMyAssets() {
        const AccountsTabBarItem = element(by.id('@tabBar/AccountsStack'));
        await waitFor(AccountsTabBarItem).toBeVisible().withTimeout(10000);
        await AccountsTabBarItem.tap();

        await detoxExpect(element(by.id('@screen/Accounts'))).toBeVisible();
    }
}

export const onTabBar = new TabBarActions();
