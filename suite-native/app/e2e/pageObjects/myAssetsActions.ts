import { expect as detoxExpect } from 'detox';

import { waitForElementByIdToBeVisible } from '../support/utils';

class MyAssetsActions {
    async waitForScreen() {
        await waitFor(element(by.id('@screen/MyAssets')))
            .toBeVisible()
            .withTimeout(5000);
    }

    async addAccount() {
        await waitForElementByIdToBeVisible('@screen/mainScrollView');
        await element(by.id('@screen/mainScrollView')).scrollTo('top');
        const addAccountButtonId = '@myAssets/addAccountButton/import';
        await waitForElementByIdToBeVisible(addAccountButtonId);
        await element(by.id(addAccountButtonId)).tap();

        await waitFor(element(by.id('@screen/SelectNetwork')))
            .toBeVisible()
            .withTimeout(5000);
    }

    async openAccountDetail({ accountName }: { accountName: string }) {
        await element(by.text(accountName)).tap();

        await detoxExpect(element(by.id('@screen/AccountDetail'))).toBeVisible();
    }
}

export const onMyAssets = new MyAssetsActions();
