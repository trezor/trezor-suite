import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';
import { expect, test } from '../../support/fixtures';
import {
    ETH_BASE_TX,
    ETH_CONFIRMED_UNSTAKE_TX,
    ETH_PENDING_UNSTAKE_TX,
} from '../../support/mocks/eth-endpoints';
import { createTestAnnotation } from '../../support/reporters/annotations';
import { splitStringByDisplayLimit } from '../../support/testExtends/customMatchers';

test.describe('ETH unstaking', { tag: ['@group=staking'] }, () => {
    test.use({
        emulatorSetupConf: {
            mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
        },
    });
    test.beforeEach(
        async ({ page, dashboardPage, onboardingPage, settingsPage, blockbookMock }) => {
            await onboardingPage.completeOnboarding();
            await settingsPage.navigateTo('coins');
            await blockbookMock.start('eth');

            await settingsPage.coins.disableNetwork('btc');
            await settingsPage.coins.enableNetwork('eth');
            await settingsPage.coins.openNetworkAdvanceSettings('eth');
            await settingsPage.coins.changeBackend('blockbook', blockbookMock.url);

            await dashboardPage.dashboardMenuButton.click();
            await page.discoveryShouldFinish();
        },
    );

    test(
        'unstake from ETH account',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can unstake his Ethereum account.',
                category: TestCategory.ETH,
                priority: TestPriority.Critical,
                stream: TestStream.Trends,
            }),
        },
        async ({ page, walletPage, devicePrompt, blockbookMock }) => {
            await test.step('Check staking account', async () => {
                await walletPage.openAccount({ symbol: 'eth', type: 'normal', atIndex: 0 });
                await page.getByTestId('@wallet/menu/staking').click();
                await expect(page.getByTestId('@account/staking/pending')).toHaveText('3,000');
                await expect(page.getByTestId('@account/staking/staked')).toHaveText('3,000');
                await expect(page.getByTestId('@account/staking/rewards')).toHaveText('1,234');
                await expect(page.getByTestId('@account/staking/unstaking')).toHaveText('4,000');
            });

            await test.step('Open unstaking form', async () => {
                await page.getByRole('button', { name: 'Unstake to claim' }).click();
                await expect(page.getByTestId('@staking/available-balance-with-symbol')).toHaveText(
                    '7,000 ETH',
                );
                await expect(page.getByTestId('@staking/unstaking-form/crypto-input')).toHaveValue(
                    '7,000',
                );
            });

            await test.step('Initiate unstaking and confirm on device', async () => {
                await page.getByTestId('@modal').getByRole('button', { name: 'Unstake' }).click();
                await expect(devicePrompt.outputValueOf('data')).toHaveText(
                    'Unstake ETH from Everstake?',
                );
                await expect(devicePrompt).toDisplayOnEmulator({
                    header: { title: 'Unstake' },
                    body: [['Unstake ETH from', '\n', 'Everstake?']],
                    footer: 'Tap to continue',
                });
                await devicePrompt.waitForPromptAndClick();
                await expect(devicePrompt.outputValueOf('amount')).toHaveText('7,000 ETH');
                await expect(devicePrompt.outputValueOf('fee')).toHaveText('0.000290278609719 ETH');
                await expect(devicePrompt).toDisplayOnEmulator({
                    header: { title: 'Unstake' },
                    body: [
                        ['Amount'],
                        [`7,000 ETH`],
                        [' '],
                        ['Maximum fee'],
                        splitStringByDisplayLimit('0.000290278609719 ETH'),
                    ],
                    footer: 'Tap to continue',
                });
                await devicePrompt.waitForFinalPromptAndConfirm();
            });

            await test.step('Unstake', async () => {
                blockbookMock.updateAccountState({
                    transactions: [ETH_PENDING_UNSTAKE_TX, ETH_BASE_TX],
                    unconfirmedTxs: 1,
                    txs: 2,
                    nonTokenTxs: 2,
                    stakingPools: [
                        {
                            contract: '0x624087DD1904ab122A32878Ce9e933C7071F53B9',
                            name: 'Everstake',
                            pendingBalance: '1000000000000000000000',
                            pendingDepositedBalance: '2000000000000000000000',
                            depositedBalance: '3000000000000000000000',
                            withdrawTotalAmount: '4000000000000000000000',
                            claimableAmount: '5000000000000000000000',
                            restakedReward: '1234000000000000000000',
                            autocompoundBalance: '0', // Lowers by 7000
                        },
                    ],
                    nonce: '2',
                });
                await page.getByTestId('@modal/send').click();
            });

            //TODO: Solve errors and remove following step
            await test.step('Navigate back to Dashboard', async () => {
                await page.getByTestId('@modal/close-button').click();
                await walletPage.openAccount({ symbol: 'eth', type: 'normal', atIndex: 0 });
                await page.getByTestId('@wallet/menu/staking').click();
            });

            await test.step('Verify pending transaction and not being able to unstake more', async () => {
                await expect(page.getByText('Pending transaction•1')).toBeVisible();
                await expect(page.getByRole('button', { name: 'Speed up' })).toBeEnabled();
                await expect(page.getByTestId('@account/staking/unstaking')).toHaveText('4,000');
                await expect(page.getByRole('button', { name: 'Unstake to claim' })).toBeDisabled();
            });

            await test.step('Wait for transaction confirmation', async () => {
                blockbookMock.updateAccountState({
                    transactions: [ETH_CONFIRMED_UNSTAKE_TX, ETH_BASE_TX],
                    unconfirmedTxs: 0,
                    stakingPools: [
                        {
                            contract: '0x624087DD1904ab122A32878Ce9e933C7071F53B9',
                            name: 'Everstake',
                            pendingBalance: '1000000000000000000000',
                            pendingDepositedBalance: '2000000000000000000000',
                            depositedBalance: '3000000000000000000000',
                            withdrawTotalAmount: '11000000000000000000000', // Increases by 7000
                            claimableAmount: '5000000000000000000000',
                            restakedReward: '1234000000000000000000',
                            autocompoundBalance: '0',
                        },
                    ],
                });
                await walletPage.openAccount({ symbol: 'eth', type: 'normal', atIndex: 0 });
                await page.getByTestId('@wallet/menu/staking').click();
                await expect(page.getByTestId('@account/staking/unstaking')).toHaveText('11,000');
            });
        },
    );
});
