class MyAssetsActions {
    async tapAddAccountButton() {
        await element(by.id('@screen/mainScrollView')).scrollTo('top');
        await element(by.id('@myAssets/addAccountButton')).tap();
    }
    async navigateToMyAssets() {
        await element(by.id('@tabBar/AccountsStack')).tap();
    }
}

export const onMyAssets = new MyAssetsActions();
