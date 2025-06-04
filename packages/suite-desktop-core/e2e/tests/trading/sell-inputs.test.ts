import { localizeNumber } from '@suite-common/wallet-utils';

import { expect, test } from '../../support/fixtures';

const customFeeRate = 1;
let bitcoinBalance: string | null;
let solanaBalance: string | null;

test.describe('Trading - Sell inputs', { tag: ['@group=trading', '@webOnly'] }, () => {
    test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_academic', passphrase_protection: true } });
    test.beforeEach(async ({ onboardingPage, dashboardPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();

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
            await test.step('Below minimum', async () => {
                await tradingPage.fillSellFormMinimumQuoteError();

                await expect
                    .soft(tradingPage.cryptoInputBottomText)
                    .toHaveText(/Minimum is 0\.\d+( BTC)?/, { timeout: 15_000 });
            });

            await test.step('Too many decimal digits', async () => {
                await tradingPage.youPayCryptoInput.fill('0.000000001');
                await expect
                    .soft(tradingPage.cryptoInputBottomText)
                    .toHaveText('Maximum 8 decimals allowed', { timeout: 15_000 });
            });

            await test.step('Not enough funds', async () => {
                await tradingPage.youPayCryptoInput.fill('10');
                await expect
                    .soft(tradingPage.cryptoInputBottomText)
                    .toHaveText('Not enough funds', {
                        timeout: 15_000,
                    });
            });

            await tradingPage.youPayCryptoInput.clear();
            await expect.soft(tradingPage.cryptoInputBottomText).not.toBeVisible();
        });

        await test.step('Try all % inputs for Bitcoin', async () => {
            await tradingPage.fees.switchModeButton('custom').click();
            await tradingPage.fees.customInput.fill(customFeeRate.toString());

            for (const percentage of [10, 25, 50]) {
                await test.step(`${percentage}% of BTC balance`, async () => {
                    await page.getByRole('button', { name: percentage + '%' }).click();
                    await tradingPage.expectInputToBe({
                        percentage,
                        balance: bitcoinBalance,
                        symbol: 'btc',
                    });
                });
            }

            await test.step('Max of BTC balance', async () => {
                await page.getByRole('button', { name: 'Max' }).click();
                await expect
                    .soft(async () => {
                        const resultingFee = await tradingPage.fees.customAmount.textContent();
                        if (!resultingFee) {
                            throw new Error('Custom Fee amount is undefined or null');
                        }
                        const maxValue = (
                            parseFloat(bitcoinBalance!) - parseFloat(resultingFee)
                        ).toString();
                        await expect(tradingPage.youPayCryptoInput).toHaveValue(
                            localizeNumber(maxValue, 'en', 0, 8),
                        );
                    })
                    .toPass({ timeout: 15_000 });
            });
        });

        await test.step('Try all % inputs on Solana', async () => {
            await tradingPage.accountDropdown.click();
            await tradingPage.accountOption('solana').click();
            await expect(tradingPage.swapAmountInputCurrencyTicker).toHaveText('SOL');

            for (const percentage of [10, 25, 50]) {
                await test.step(`${percentage}% of Solana balance`, async () => {
                    await page.getByRole('button', { name: percentage + '%' }).click();
                    await tradingPage.expectInputToBe({
                        percentage,
                        balance: solanaBalance,
                        symbol: 'sol',
                    });
                });
            }

            await test.step('Max of Solana balance', async () => {
                await page.getByRole('button', { name: 'Max' }).click();
                const resultingFee = await tradingPage.fees.getSolanaFee();
                const maxValue = (parseFloat(solanaBalance!) - resultingFee).toString();
                await expect
                    .soft(tradingPage.youPayCryptoInput)
                    .toHaveValue(localizeNumber(maxValue, 'en', 0, 9));
            });
        });
    });
});
