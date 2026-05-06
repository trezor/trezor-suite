import { expect as detoxExpect } from 'detox';

import { waitForVisible } from '../support/utils';

const graphHeaderDiscreetTextElement = element(by.id('discreet-text'));

class HomeActions {
    async waitForScreen() {
        await waitForVisible(by.id('@screen/Home'));
    }

    async assertIsPortfolioGraphVisible() {
        await waitForVisible(by.id('@home/portfolio/graph'));
    }

    async scrollScreenToBottom() {
        await element(by.id('@screen/mainScrollView')).scrollTo('bottom');
    }

    async tapGetStartedButton() {
        await element(by.id('@home/get-started-button')).tap();
    }

    async tapSyncCoinsButton() {
        await this.scrollScreenToBottom();
        await element(by.id('@home/portfolio/sync-coins-button')).tap();

        await detoxExpect(element(by.id('@screen/SelectNetwork'))).toBeVisible();
    }

    async assertIsDiscreetModeDisabled() {
        await waitFor(graphHeaderDiscreetTextElement).not.toBeVisible().withTimeout(10000);
    }

    async assertIsDiscreetModeEnabled() {
        await waitForVisible(graphHeaderDiscreetTextElement);
    }
}

export const onHome = new HomeActions();
