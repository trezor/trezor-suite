import { scrollUntilVisible } from '../utils';
import { onDeviceConnecting } from './deviceConnectingActions';
import { onHome } from './homeActions';

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

    async handleCoinEnablingInit(coins = ['btc']) {
        await this.waitForInitScreen();
        for (const coin of coins) {
            await this.toggleNetwork(coin);
        }
        await this.clickOnConfirmButton();
        await onDeviceConnecting.waitForDeviceConnectingScreen();
        await onHome.waitForScreen();
    }
}

export const onCoinEnabling = new CoinEnablingActions();
