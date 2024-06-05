import { expect as detoxExpect } from 'detox';

class HomeActions {
    async tapSyncCoinsButton() {
        await element(by.id('@screen/mainScrollView')).scrollTo('bottom');
        await element(by.id('@home/portfolio/sync-coins-button')).tap();

        await detoxExpect(element(by.id('@screen/SelectNetwork'))).toBeVisible();
    }
}

export const onHome = new HomeActions();
