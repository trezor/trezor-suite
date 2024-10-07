import { expect as detoxExpect } from 'detox';

class MyAssetsActions {
    async waitForScreen() {
        await waitFor(element(by.id('@screen/MyAssets')))
            .toBeVisible()
            .withTimeout(5000);
    }

    async addAccount() {
        await element(by.id('@screen/mainScrollView')).scrollTo('top');
        await element(by.id('@myAssets/addAccountButton')).tap();

        await detoxExpect(element(by.id('@screen/SelectNetwork'))).toBeVisible();
    }

    async openAccountDetail({ accountName }: { accountName: string }) {
        await element(by.text(accountName)).tap();

        await detoxExpect(element(by.id('@screen/AccountDetail'))).toBeVisible();
    }
}

export const onMyAssets = new MyAssetsActions();
