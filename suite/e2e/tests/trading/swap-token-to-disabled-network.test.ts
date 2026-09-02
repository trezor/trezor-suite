import { getCryptoId } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';

import { expect, test } from '../../support/fixtures';

const sendAmount = '9';
const accountLabel = 'Stellar #1';

test.describe(
    'Trading - Swap token to disabled network asset',
    {
        tag: ['@T3W1', '@T3T1'],
    },
    () => {
        test.use({
            deviceSetup: { mnemonic: 'mnemonic_academic', passphrase_protection: true },
        });

        test.beforeEach(async ({ onboardingPage, dashboardPage, walletPage, settingsPage }) => {
            await onboardingPage.completeOnboarding();
            await settingsPage.changeNetworks({ enableNetworks: ['sol'] });
            await dashboardPage.openDeviceSwitcher();
            await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
            await walletPage.openSwapTrading({ symbol: 'sol' });
        });

        test('Show provider info for disabled network asset XLM and enable it', async ({
            tradingPage,
        }) => {
            await test.step('Fill in a Swap form with Stellar buy asset', async () => {
                await tradingPage.fillSwapForm({
                    amount: sendAmount,
                    sellAsset: {
                        networkSymbol: 'sol',
                        tokenSymbol: 'USDT',
                    },
                    buyAsset: {
                        searchFilter: 'XLM',
                        networkFilter: 'xlm',
                        assetCryptoId: getCryptoId(asNetworkSymbol('xlm')),
                    },
                });
            });

            await test.step('Verify provider info is visible in quotes', async () => {
                await expect(tradingPage.quotes.selectedProvider).toBeVisible();
            });

            await test.step('Enable the Stellar network from the receive account picker', async () => {
                await tradingPage.receiveAccount.selectAddSuiteReceiveAccount(0, 'xlm');
                await expect(tradingPage.receiveAccount.selectedReceiveAccount).toContainText(
                    accountLabel,
                );
            });
        });
    },
);
