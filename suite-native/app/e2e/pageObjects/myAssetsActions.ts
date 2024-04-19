class MyAssetsActions {
    async tapAddAccountButton() {
        await element(by.id('@screen/mainScrollView')).scrollTo('top');
        await element(by.id('@myAssets/addAccountButton')).tap();
    }

    async openAccountDetail({ accountName }: { accountName: string }) {
        await element(by.text(accountName)).tap();
    }
}

export const onMyAssets = new MyAssetsActions();
