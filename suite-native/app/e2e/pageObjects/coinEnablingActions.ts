import { scrollUntilVisible } from '../utils';

class CoinEnablingActions {
    async waitForInitScreen() {
        await waitFor(element(by.id('@screen/CoinEnablingInit')))
            .toBeVisible()
            .withTimeout(10000);
    }

    async toggleNetwork(symbol: string) {
        const networkElement = element(by.id(`@coin-enabling/toggle-${symbol}`));
        await scrollUntilVisible(networkElement);
        await networkElement.tap();
    }

    async clickOnConfirmButton() {
        await element(by.id('@coin-enabling/button-save')).tap();
    }
}

export const onCoinEnabling = new CoinEnablingActions();
