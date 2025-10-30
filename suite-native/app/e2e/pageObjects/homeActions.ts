import { expect as detoxExpect } from 'detox';

import { waitForElementByIdToBeVisible } from '../support/utils';

const graphHeaderDiscreetTextElement = element(by.id('discreet-text'));

class HomeActions {
    async waitForScreen() {
        await waitFor(element(by.id('@screen/Home')))
            .toBeVisible()
            .withTimeout(10000);
    }

    async assertIsPortfolioGraphVisible() {
        await waitForElementByIdToBeVisible('@home/portfolio/graph');
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
