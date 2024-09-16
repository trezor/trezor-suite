class OnCoinEnablingInit {
    async waitForBtcToBeVisible() {
        await waitFor(element(by.id('@coin-enabling/toggle-btc')))
            .toBeVisible()
            .withTimeout(3000);
    }
    async enableNetwork(networkSymbol: string) {
        await element(by.id(`@coin-enabling/toggle-${networkSymbol}`)).tap();
    }

    async save() {
        await waitFor(element(by.id('@coin-enabling/button-save')))
            .toBeVisible()
            .withTimeout(3000);

        await element(by.id('@coin-enabling/button-save')).tap();
    }
}

export const onCoinEnablingInit = new OnCoinEnablingInit();
