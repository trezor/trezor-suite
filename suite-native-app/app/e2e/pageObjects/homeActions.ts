import { expect as detoxExpect } from 'detox';

import { waitForVisible } from '../support/utils';

type AssertIsDiscreetModeEnabledParams = {
    assetSymbol: string;
    visibleAmount: string;
    redactedAmount: string;
};

class HomeActions {
    async waitForScreen() {
        await waitForVisible(by.id('@screen/Home'));
    }

    async waitForDiscoveryComplete() {
        await waitFor(element(by.id('@assets/discovery/loading')))
            .not.toBeVisible()
            .withTimeout(60_000);
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

    async assertIsDiscreetModeDisabled(assetSymbol: string, visibleAmount: string) {
        await this.scrollScreenToBottom();
        await waitForVisible(by.id(`@assets/cryptoAmount/${assetSymbol}`));
        await detoxExpect(element(by.id(`@assets/cryptoAmount/${assetSymbol}`))).toHaveText(
            visibleAmount,
        );
        await detoxExpect(
            element(by.id('discreet-text').withAncestor(by.id(`@assets/item/${assetSymbol}`))),
        ).not.toExist();
    }

    async assertIsDiscreetModeEnabled({
        assetSymbol,
        visibleAmount,
        redactedAmount,
    }: AssertIsDiscreetModeEnabledParams) {
        await this.scrollScreenToBottom();
        // React Native may hoist the native blur out of the Discreet layout wrapper.
        const concealedAmount = element(
            by.id('blur-native').withDescendant(by.id(`@assets/cryptoAmount/${assetSymbol}`)),
        );
        await waitForVisible(concealedAmount);
        await detoxExpect(element(by.id(`@assets/cryptoAmount/${assetSymbol}`))).toHaveText(
            redactedAmount,
        );
        await detoxExpect(
            element(by.text(visibleAmount).withAncestor(by.id(`@assets/item/${assetSymbol}`))),
        ).not.toExist();
    }
}

export const onHome = new HomeActions();
