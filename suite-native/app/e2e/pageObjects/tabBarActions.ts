import { expect as detoxExpect } from 'detox';

import { waitForVisible } from '../support/utils';

class TabBarActions {
    async navigateToHome() {
        const homeTabBarItem = element(by.id('@tabBar/HomeStack'));
        await waitForVisible(homeTabBarItem);
        await homeTabBarItem.tap();

        await detoxExpect(element(by.id('@screen/Home'))).toBeVisible();
    }
    async navigateToMyAssets() {
        const AccountsTabBarItem = element(by.id('@tabBar/AccountsStack'));
        await waitForVisible(AccountsTabBarItem);
        await AccountsTabBarItem.tap();

        await detoxExpect(element(by.id('@screen/Accounts'))).toBeVisible();
    }

    async navigateToSettings() {
        const settingsTabBarItem = element(by.id('@tabBar/Settings'));
        await waitForVisible(settingsTabBarItem);
        await settingsTabBarItem.tap();

        await detoxExpect(element(by.id('@screen/Settings'))).toBeVisible();
    }

    async tapBackButton() {
        const backButton = element(by.id('@screen/sub-header/go-back-button')).atIndex(0);
        await waitForVisible(backButton);
        await backButton.tap();
    }

    async navigateToTrade() {
        const tradeTabBarItem = element(by.id('@tabBar/TradeStack'));
        await waitForVisible(tradeTabBarItem);
        await tradeTabBarItem.tap();

        await detoxExpect(element(by.id('@screen/Trading'))).toBeVisible();
    }

    async assertHomeTabBarItemTitle(title: string) {
        await detoxExpect(element(by.id('@tabBar/HomeStack/title'))).toHaveText(title);
    }
}

export const onTabBar = new TabBarActions();
