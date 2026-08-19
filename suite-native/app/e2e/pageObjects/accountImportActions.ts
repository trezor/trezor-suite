import { expect as detoxExpect } from 'detox';

import { onTabBar } from './tabBarActions';
import { inputTextToElement, scrollUntilVisible, waitForVisible } from '../support/utils';

class AccountImportActions {
    async importAccountAndVerifyVisibility({
        networkSymbol,
        xpub,
        accountName,
    }: {
        networkSymbol: string;
        xpub: string;
        accountName: string;
    }) {
        await this.selectCoin({ networkSymbol });
        await this.submitXpub({ xpub, isValid: true });
        await this.setAccountName({ accountName });
        await this.confirmAddAccount();
        await onTabBar.navigateToMyAssets();

        // after importing some accounts, not all are visible, scrolling might be needed
        await scrollUntilVisible(element(by.text(accountName)), {
            scrollViewTestId: '@accountList',
        });
    }

    async selectCoin({ networkSymbol }: { networkSymbol: string }) {
        // not all coin types are visible, so first check if visible, if not, scroll
        const coinItemElement = element(
            by.id(`@onboarding/select-coin/${networkSymbol.toLowerCase()}`),
        );
        // Espresso's native search-scroll loop (waitFor+whileElement+scroll) fires rapid scroll
        // events that flood the JS bridge on API 34 with the non-virtualized coin list, causing
        // the JS thread to become unresponsive (ANR) and the app to crash. A JS-controlled loop
        // with async/await boundaries lets the event loop drain scroll callbacks between steps.
        //
        // 1500 px per step ensures coins deep in the list (e.g. ZEC at y≈3066 px) become visible
        // in a single scroll. The first scroll triggers the ScrollDivider FadeIn (Reanimated), which
        // temporarily elevates swiftshader memory usage. A second scroll on top of that elevated
        // baseline OOM-kills the QEMU emulator process on memory-constrained CI runners. One large
        // scroll avoids a second scroll entirely.
        const scrollView = element(by.id('@screen/mainScrollView'));
        for (let i = 0; i < 5; i++) {
            try {
                await detoxExpect(coinItemElement).toBeVisible(75);
                break;
            } catch {
                await scrollView.scroll(1500, 'down');
            }
        }
        await coinItemElement.tap();
        await detoxExpect(element(by.id('@screen/XpubScan'))).toBeVisible();
    }

    async submitXpub({ xpub, isValid }: { xpub: string; isValid: boolean }) {
        const xpubInput = element(by.id('@accounts-import/sync-coins/xpub-input'));
        await inputTextToElement(xpubInput, xpub);

        const xpubSubmitButton = element(by.id('@accounts-import/sync-coins/xpub-submit'));
        await scrollUntilVisible(xpubSubmitButton);
        await xpubSubmitButton.tap();

        if (isValid) {
            await waitForVisible(by.id('@screen/AccountImportSummary'));
        }
    }

    async setAccountName({ accountName }: { accountName: string }) {
        const accountNameInput = element(by.id('@account-import/coin-synced/label-input'));
        await accountNameInput.clearText();
        await accountNameInput.typeText(accountName);
    }

    async confirmAddAccount() {
        const confirmButton = element(by.id('@account-import/coin-synced/confirm-button'));
        await scrollUntilVisible(confirmButton);
        await confirmButton.tap();
        await detoxExpect(element(by.id('@screen/Accounts'))).toBeVisible();
    }
}

export const onAccountImport = new AccountImportActions();
