import type { NetworkSymbol } from '@suite-common/wallet-config';

import { expect, test } from '../../support/fixtures';

const testCases: { symbol: NetworkSymbol; xpub: string }[] = [
    {
        symbol: 'btc',
        xpub: 'zpub6qg8ncjmySnBmRKsVc6TE3ojd89P9Ss3r7j3K121p4QJ9YAfSgy6yM1ikhxPdLxdCQvoFU73gwPDjxcGNVFo1hBUGTJZvgfrGQZ4WXDo5PF',
    },
    {
        symbol: 'ltc',
        xpub: 'zpub6rCPNJ3Fm3ZLoj34ZRaYRFTWugZERyvZhuXYX6bdHqn94aFofL6R5W3iSQa2Ayagd8WKWVMsZvNH4AcXhYgiQmm2SnjqRZibGEZDtazWoWf',
    },
    {
        symbol: 'ada',
        xpub: '255eb541a4c62cb774a2a74b4309001060708d31124c481c2fd67f7c0005ce2cc8a57c0bc10b630d30874620547c4e9f908b0ab239e75ee8eb38769b8163710c',
    },
];

test.describe('Public Keys', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({
        deviceSetup: {
            mnemonic: 'town grace cat forest dress dust trick practice hair survey pupil regular',
        },
    });

    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding();
    });

    testCases.forEach(({ symbol, xpub }) => {
        test(`Check ${symbol} XPUB`, async ({ settingsPage, walletPage, devicePrompt }) => {
            await test.step(`Activate coin ${symbol}`, async () => {
                await settingsPage.changeNetworks({ enableNetworks: [symbol] });
            });

            await test.step('Verify Public key preview', async () => {
                await walletPage.openAccount({ symbol });
                await walletPage.accountDetailsTabButton.click();
                await walletPage.showPublicKeyButton.click();
                await expect(async () => {
                    const value = await devicePrompt.outputValue.textContent();

                    expect(value?.replace(/\s+/g, '')).toBe(xpub);
                }).toPass({ timeout: 25000 });
            });

            await test.step('Display and Verify Public key again', async () => {
                await devicePrompt.waitForPromptAndConfirm();

                const value = await devicePrompt.outputValue.textContent();

                expect(value?.replace(/\s+/g, '')).toBe(xpub);
            });
        });
    });
});
