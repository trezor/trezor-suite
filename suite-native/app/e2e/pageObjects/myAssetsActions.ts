import { expect as detoxExpect } from 'detox';

class MyAssetsActions {
    async addAccount() {
        await element(by.id('@screen/mainScrollView')).scrollTo('top');
        await element(by.id('@myAssets/addAccountButton')).tap();

        await detoxExpect(element(by.id('@screen/SelectNetwork'))).toBeVisible();
    }

    async openAccountDetail({
        accountName,
        accDetail = 'detail',
    }: {
        accountName: string;
        accDetail?: 'detail' | 'receive';
    }) {
        const newScreenElement =
            accDetail === 'detail' ? '@screen/AccountDetail' : '@screen/Receive';
        await element(by.text(accountName)).tap();
        await detoxExpect(element(by.id(newScreenElement))).toBeVisible();
    }
}

export const onMyAssets = new MyAssetsActions();
