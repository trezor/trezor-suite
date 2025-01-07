import { NetworkSymbol } from '@suite-common/wallet-config';

import { test, expect } from '../../support/fixtures';

const testCases: { symbol: NetworkSymbol; xpubPreview: string; xpub: string }[] = [
    {
        symbol: 'btc',
        xpubPreview:
            'zpub6qg8ncjmySnBmRKsVc6TE3ojd89P9Ss3r7j3K121p4QJ9YAfSgy6yM1ikhxPdLxdCQvoFU73gwPDj',
        xpub: 'zpub6qg8ncjmySnBmRKsVc6TE3ojd89P9Ss3r7j3K121p4QJ9YAfSgy6yM1ikhxPdLxdCQvoFU73gwPDjxcGNVFo1hBUGTJZvgfrGQZ4WXDo5PF',
    },
    {
        symbol: 'ltc',
        xpubPreview:
            'zpub6rCPNJ3Fm3ZLoj34ZRaYRFTWugZERyvZhuXYX6bdHqn94aFofL6R5W3iSQa2Ayagd8WKWVMsZvNH4',
        xpub: 'zpub6rCPNJ3Fm3ZLoj34ZRaYRFTWugZERyvZhuXYX6bdHqn94aFofL6R5W3iSQa2Ayagd8WKWVMsZvNH4AcXhYgiQmm2SnjqRZibGEZDtazWoWf',
    },
    {
        symbol: 'vtc',
        xpubPreview:
            'zpub6ryn7rf1h1KuoWa5F3QTD9qqvxTGXq8mg5M3vNyAnJ9wF6oMe3MT7QygNbyUFupepdMBvCcugzQgW',
        xpub: 'zpub6ryn7rf1h1KuoWa5F3QTD9qqvxTGXq8mg5M3vNyAnJ9wF6oMe3MT7QygNbyUFupepdMBvCcugzQgWRsLwa2P4jaMQAFHarSa84KDQNbabxp',
    },
    {
        symbol: 'ada',
        xpubPreview:
            '255eb541a4c62cb774a2a74b4309001060708d31124c481c2fd67f7c0005ce2cc8a57c0bc10b630d3',
        xpub: '255eb541a4c62cb774a2a74b4309001060708d31124c481c2fd67f7c0005ce2cc8a57c0bc10b630d30874620547c4e9f908b0ab239e75ee8eb38769b8163710c',
    },
];

test.describe('Public Keys', { tag: ['@group=wallet'] }, () => {
    test.use({
        emulatorStartConf: { wipe: true },
        emulatorSetupConf: {
            mnemonic: 'town grace cat forest dress dust trick practice hair survey pupil regular',
        },
    });

    test.beforeEach(async ({ onboardingPage, dashboardPage }) => {
        await onboardingPage.completeOnboarding();
        await dashboardPage.discoveryShouldFinish();
    });

    testCases.forEach(({ symbol, xpubPreview, xpub }) => {
        test(`Check ${symbol} XPUB`, async ({ page, settingsPage, walletPage, devicePrompt }) => {
            if (symbol !== 'btc') {
                await test.step(`Activate coin ${symbol}`, async () => {
                    await page.getByTestId('@account-menu/add-account').click();
                    await settingsPage.coins.enableNetwork(symbol);
                    await page.getByRole('button', { name: 'Find my' }).click();
                });
            }
            await test.step('Verify Public key preview', async () => {
                await walletPage.accountButton({ symbol }).click();
                await walletPage.accountDetailsTabButton.click();
                await walletPage.showPublicKeyButton.click();
                await expect(devicePrompt.displayText).toContainText(xpubPreview);
                await expect(devicePrompt.displayText).not.toContainText(xpub);
            });
            await test.step('Display and Verify whole Public key', async () => {
                await devicePrompt.waitForPromptAndConfirm();
                await expect(page.getByTestId('@modal/output-value')).toHaveText(xpub);
            });
        });
    });
});
