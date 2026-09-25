import { expect as detoxExpect } from 'detox';

import EN_TRANSLATIONS from '@suite-native/intl/translations/en-US.json';

import { waitForVisible } from '../support/utils';

const getTabBarItem = (routeName: string, title: string) =>
    element(
        device.getPlatform() === 'android'
            ? by.text(title).withAncestor(by.id('@tabBar'))
            : by.id(`@tabBar/${routeName}`),
    );

class TabBarActions {
    async navigateToHome(title = EN_TRANSLATIONS['navigation.tabs.home']) {
        const homeTabBarItem = getTabBarItem('HomeStack', title);
        await waitForVisible(homeTabBarItem);
        await homeTabBarItem.tap();

        await detoxExpect(element(by.id('@screen/Home'))).toBeVisible();
    }
    async navigateToMyAssets() {
        const accountsTabBarItem = getTabBarItem(
            'AccountsStack',
            EN_TRANSLATIONS['navigation.tabs.accountsList'],
        );
        await waitForVisible(accountsTabBarItem);
        await accountsTabBarItem.tap();

        await detoxExpect(element(by.id('@screen/Accounts'))).toBeVisible();
    }

    async navigateToSettings() {
        const settingsTabBarItem = getTabBarItem(
            'Settings',
            EN_TRANSLATIONS['navigation.tabs.settings'],
        );
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
        const tradeTabBarItem = getTabBarItem(
            'TradeStack',
            EN_TRANSLATIONS['navigation.tabs.trade'],
        );
        await waitForVisible(tradeTabBarItem);
        await tradeTabBarItem.tap();

        await detoxExpect(element(by.id('@screen/Trading'))).toBeVisible();
    }

    async assertTradingIsNotVisible() {
        await detoxExpect(element(by.id('@screen/Trading'))).not.toBeVisible();
    }

    async assertHomeTabBarItemTitle(title: string) {
        if (device.getPlatform() === 'android') {
            await detoxExpect(getTabBarItem('HomeStack', title)).toBeVisible();
        } else {
            await detoxExpect(getTabBarItem('HomeStack', title)).toHaveLabel(title);
        }
    }
}

export const onTabBar = new TabBarActions();
