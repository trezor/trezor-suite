import { expect as detoxExpect } from 'detox';

class HomeActions {
    async waitForScreen() {
        await waitFor(element(by.id('@screen/Home')))
            .toBeVisible()
            .withTimeout(10000);
    }

    async tapSyncCoinsButton() {
        await element(by.id('@screen/mainScrollView')).scrollTo('bottom');
        await element(by.id('@home/portfolio/sync-coins-button')).tap();

        await detoxExpect(element(by.id('@screen/SelectNetwork'))).toBeVisible();
    }
}

export const onHome = new HomeActions();
