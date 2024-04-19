class TabBarActions {
    async navigateToMyAssets() {
        await element(by.id('@tabBar/AccountsStack')).tap();
    }
}

export const onTabBar = new TabBarActions();
