import { expect as detoxExpect } from 'detox';

import { waitForVisible } from '../support/utils';

class MyAssetsActions {
    async waitForScreen() {
        await waitForVisible(by.id('@screen/MyAssets'));
    }

    async addAccount() {
        await waitForVisible(by.id('@screen/mainScrollView'));
        await element(by.id('@screen/mainScrollView')).scrollTo('top');
        const addAccountButtonId = '@myAssets/addAccountButton/import';
        await waitForVisible(by.id(addAccountButtonId));
        await element(by.id(addAccountButtonId)).tap();
        await waitForVisible(by.id('@screen/SelectNetwork'));
    }

    async openAccountDetail({ accountName }: { accountName: string }) {
        await waitForVisible(by.text(accountName));
        await element(by.text(accountName)).tap();
        await detoxExpect(element(by.id('@screen/AccountDetail'))).toBeVisible();
    }
}

export const onMyAssets = new MyAssetsActions();
