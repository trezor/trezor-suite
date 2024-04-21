import { expect as detoxExpect } from 'detox';

class TabBarActions {
    async navigateToMyAssets() {
        await element(by.id('@tabBar/AccountsStack')).tap();

        await detoxExpect(element(by.id('@screen/Accounts'))).toBeVisible();
    }
}

export const onTabBar = new TabBarActions();
