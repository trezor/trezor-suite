import { expect as detoxExpect } from 'detox';

import { scrollToEnd } from '../utils';

class MyAssetsActions {
    async waitForScreen() {
        await waitFor(element(by.id('@screen/MyAssets')))
            .toBeVisible()
            .withTimeout(5000);
    }

    async addAccount() {
        await scrollToEnd('@screen/mainScrollView', 'top');
        await element(by.id('@myAssets/addAccountButton')).tap();

        await detoxExpect(element(by.id('@screen/SelectNetwork'))).toBeVisible();
    }

    async openAccountDetail({ accountName }: { accountName: string }) {
        await element(by.text(accountName)).tap();

        await detoxExpect(element(by.id('@screen/AccountDetail'))).toBeVisible();
    }
}

export const onMyAssets = new MyAssetsActions();
