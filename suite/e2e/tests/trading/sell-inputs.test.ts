import { localizeNumber } from '@suite-common/wallet-utils';

import { expect, test } from '../../support/fixtures';
import { fulfillWithResult } from '../../support/mocks/solanaStakingMock';

const solanaBalanceAddress = '41baq3croaLZEj8dPWZnXn8e6xdAtvtWu2h941vm3Ngw';
const customFeeRate = 1;
let bitcoinBalance: string | null;
let solanaBalance: string | null;

test.describe('Trading - Sell inputs', { tag: ['@webOnly', '@T3W1', '@T3T1'] }, () => {
    test.use({
        deviceSetup: { mnemonic: 'mnemonic_academic', passphrase_protection: true },
    });
    test.beforeEach(async ({ onboardingPage, dashboardPage, settingsPage, solanaStakingMock }) => {
        await onboardingPage.completeOnboarding();
        await test.step('Mock Solana account to have 5 SOL', async ({}) => {
            await solanaStakingMock.replaceRoute('getBalance', {
                predicate: params => params?.[0] === solanaBalanceAddress,
                respond: async (route, body) => {
                    await fulfillWithResult(route, body, {
                        context: { slot: 0 },
                        value: 5_000_000_000,
                    });
                },
            });
        });
        await test.step('Enable Solana', async () => {
            await settingsPage.changeNetworks({ enableNetworks: ['sol'] });
            await dashboardPage.deviceSwitchingOpenButton.click();
            await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
        });
    });

    test('Sell form % inputs and limits', async ({ page, walletPage, tradingPage }) => {
        await test.step('Find out btc and sol balances', async () => {
            await walletPage.openAccount({ symbol: 'btc' });
            bitcoinBalance = await walletPage.topPanelBalance.textContent();
            await walletPage.openAccount({ symbol: 'sol' });
            solanaBalance = await walletPage.topPanelBalance.textContent();
            await walletPage.openTrading();
            await tradingPage.sellTabButton.click();
        });

        await test.step('Check limits for BTC input', async () => {
            await test.step('Too many decimal digits', async () => {
                await tradingPage.inputs.cryptoAmount.fill('0.000000001');
                await expect
                    .soft(tradingPage.inputs.bottomText)
                    .toHaveTranslation('AMOUNT_IS_NOT_IN_RANGE_DECIMALS', {
                        values: { decimals: '8' },
                        timeout: 15_000,
                    });
            });

            await test.step('Not enough funds', async () => {
                await tradingPage.inputs.cryptoAmount.fill('10');
                await expect
                    .soft(tradingPage.inputs.bottomText)
                    .toHaveTranslation('AMOUNT_IS_NOT_ENOUGH', { timeout: 15_000 });
            });

            await tradingPage.inputs.cryptoAmount.clear();
            await expect.soft(tradingPage.inputs.bottomText).toBeHidden();
        });

        await test.step('Try all % inputs for Bitcoin', async () => {
            await tradingPage.inputs.selectFiatCurrency('eur');
            for (const percentage of [10, 25, 50]) {
                await test.step(`${percentage}% of BTC balance`, async () => {
                    await tradingPage.inputs.fractionButtons
                        .getByRole('button', { name: percentage + '%' })
                        .click();
                    await tradingPage.inputs.expectInputToBe({
                        percentage,
                        balance: bitcoinBalance,
                        symbol: 'btc',
                    });
                });
            }
            await tradingPage.fees.switchToCustom();
            await tradingPage.fees.customInput.fill(customFeeRate.toString());

            await test.step('Max of BTC balance', async () => {
                await tradingPage.inputs.fractionButtons
                    .getByRole('button', { name: 'Max' })
                    .click();
                await expect
                    .soft(async () => {
                        const resultingFee = await tradingPage.fees.maxFee.textContent();
                        if (!resultingFee) {
                            throw new Error('Custom Fee amount is undefined or null');
                        }
                        const maxValue = (
                            parseFloat(bitcoinBalance!) - parseFloat(resultingFee)
                        ).toString();
                        await expect(tradingPage.inputs.cryptoAmount).toHaveValue(
                            localizeNumber(maxValue, 'en-US', 0, 8),
                        );
                    })
                    .toPass({ timeout: 15_000 });
            });
        });

        await test.step('Try all % inputs on Solana', async () => {
            await walletPage.openAccount({ symbol: 'sol', atIndex: 0 });
            await walletPage.sellButton.click();
            await expect(tradingPage.inputs.swapAmountCurrencyTicker).toHaveText('SOL');
            await tradingPage.inputs.selectFiatCurrency('eur');

            for (const percentage of [10, 25, 50]) {
                await test.step(`${percentage}% of Solana balance`, async () => {
                    await page.getByRole('button', { name: percentage + '%' }).click();
                    await tradingPage.inputs.expectInputToBe({
                        percentage,
                        balance: solanaBalance,
                        symbol: 'sol',
                    });
                });
            }

            //TODO: Bug in production
            // await test.step('Max of Solana balance', async () => {
            //     await page.getByRole('button', { name: 'Max' }).click();
            //     const resultingFee = await tradingPage.fees.getSolanaFee();
            //     const maxValue = (parseFloat(solanaBalance!) - resultingFee).toString();
            //     await expect
            //         .soft(tradingPage.inputs.cryptoAmount)
            //         .toHaveValue(localizeNumber(maxValue, 'en-US', 0, 9));
            // });
        });
    });
});
