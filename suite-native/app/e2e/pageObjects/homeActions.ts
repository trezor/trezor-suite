import { expect as detoxExpect } from 'detox';

const graphHeaderDiscreetTextElement = element(
    by.id('@home/portfolio/fiat-balance-header').withDescendant(by.id('discreet-text')),
);

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

    async assertIsDiscreetModeDisabled() {
        await waitFor(graphHeaderDiscreetTextElement).not.toBeVisible().withTimeout(10000);
    }

    async assertIsDiscreetModeEnabled() {
        await waitFor(graphHeaderDiscreetTextElement).toBeVisible().withTimeout(10000);
    }
}

export const onHome = new HomeActions();
