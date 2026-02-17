import { invityEndpoint, sellQuotesBTC, sellTradeBTC, sellWatchBTC } from '../../fixtures/invity';
import { expect, test } from '../../support/fixtures';
import { FeeTypes } from '../../support/pageObjects/trading/feeSection';

interface FeeSwitchTestCase {
    feeType: FeeTypes | 'custom';
    feeSwitchFunction: () => Promise<void>;
}

// Expected values based on our mocked responses
const cryptoAmount = sellQuotesBTC[0].cryptoStringAmount;

test.describe('Trading - Sell BTC', { tag: ['@group=trading', '@webOnly'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_academic', passphrase_protection: true } });
    test.beforeEach(async ({ page, tradingMock, onboardingPage, dashboardPage }) => {
        await test.step('Mocking responses', async () => {
            await page.route(invityEndpoint.sellQuotes, async route => {
                await route.fulfill({ json: sellQuotesBTC });
            });
            await tradingMock.routeTrade(invityEndpoint.sellTrade, sellTradeBTC);
            await page.route(invityEndpoint.sellWatch, async route => {
                await route.fulfill({ json: sellWatchBTC });
            });
            await onboardingPage.completeOnboarding();
            await dashboardPage.deviceSwitchingOpenButton.click();
            await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
        });
    });

    test('Bitcoin sell fees', async ({ walletPage, tradingPage, devicePrompt }) => {
        const testCases: FeeSwitchTestCase[] = [
            {
                feeType: 'economy',
                feeSwitchFunction: async () => {
                    await tradingPage.fees.card('economy').click();
                },
            },
            {
                feeType: 'normal',
                feeSwitchFunction: async () => {
                    await tradingPage.fees.card('normal').click();
                },
            },
            {
                feeType: 'high',
                feeSwitchFunction: async () => {
                    await tradingPage.fees.card('high').click();
                },
            },
            {
                feeType: 'custom',
                feeSwitchFunction: async () => {
                    await tradingPage.fees.switchToCustom();
                    await tradingPage.fees.customInput.fill('10');
                },
            },
        ];

        for (const { feeType, feeSwitchFunction } of testCases) {
            await test.step(`${feeType} fee`, async () => {
                let feeRate: string | undefined;
                await test.step('Open sell form', async () => {
                    await walletPage.openTrading();
                    await tradingPage.sellTabButton.click();
                });

                await test.step(`Fill in a sell form with ${feeType} fee`, async () => {
                    await tradingPage.fillSellForm({ cryptoAmount });
                    await tradingPage.fees.openCollapsibleFees();
                    await feeSwitchFunction();
                    feeRate = await tradingPage.fees.getBitcoinFeeRate(feeType);
                });

                await test.step('Confirm sell', async () => {
                    await tradingPage.sellBestOfferButton.click();
                });

                await tradingPage.waitForRedirectCompletion();

                await test.step('Initiate send and verify Fee', async () => {
                    await tradingPage.confirmation.initiateSendConfirmation();
                    await expect(devicePrompt.headerParagraph).toContainText('Bitcoin #1');
                    await expect(devicePrompt.cryptoAmountOf('fee')).toHaveTextGreaterThan(0);
                    const errorMessage = `expected ${feeType} fee on Device Prompt to be:`;
                    expect.soft(await devicePrompt.getFeeRate(), errorMessage).toBe(feeRate);

                    //TODO: Do verification on emulator display
                });
                await devicePrompt.closeButton.click();
            });
        }
    });
});
