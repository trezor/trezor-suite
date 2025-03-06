import { expect as detoxExpect } from 'detox';

class TabBarActions {
    async navigateToMyAssets() {
        const AccountsTabBarItem = element(by.id('@tabBar/AccountsStack'));
        await waitFor(AccountsTabBarItem).toBeVisible().withTimeout(10000);
        await AccountsTabBarItem.tap();

        await detoxExpect(element(by.id('@screen/Accounts'))).toBeVisible();
    }

    async navigateToSettings() {
        const settingsTabBarItem = element(by.id('@tabBar/Settings'));
        await waitFor(settingsTabBarItem).toBeVisible().withTimeout(10000);
        await settingsTabBarItem.tap();

        await detoxExpect(element(by.id('@screen/Settings'))).toBeVisible();
    }
}

export const onTabBar = new TabBarActions();
