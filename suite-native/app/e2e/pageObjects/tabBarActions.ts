import { expect as detoxExpect } from 'detox';

class TabBarActions {
    async navigateToHome() {
        const homeTabBarItem = element(by.id('@tabBar/HomeStack'));
        await waitFor(homeTabBarItem).toBeVisible().withTimeout(10000);
        await homeTabBarItem.tap();

        await detoxExpect(element(by.id('@screen/Home'))).toBeVisible();
    }
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

    async tapBackButton() {
        const backButton = element(by.id('@screen/sub-header/icon-left'));
        await waitFor(backButton).toBeVisible().withTimeout(10000);
        await backButton.tap();
    }
}

export const onTabBar = new TabBarActions();
