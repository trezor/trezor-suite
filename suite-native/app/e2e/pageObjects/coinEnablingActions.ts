import { onDeviceConnecting } from './deviceConnectingActions';
import { onHome } from './homeActions';
import { scrollUntilVisible, waitForVisible } from '../support/utils';

class CoinEnablingActions {
    async waitForInitScreen() {
        await waitForVisible(by.id('@screen/CoinEnablingInit'));
    }

    async toggleNetwork(symbol: string) {
        const networkElement = element(by.id(`@coin-enabling/toggle-${symbol}`));
        await scrollUntilVisible(networkElement, {
            scrollViewTestId: '@coin-enabling/network-list',
        });
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
