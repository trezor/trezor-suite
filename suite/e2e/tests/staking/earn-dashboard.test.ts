import { asNetworkSymbol } from '@suite-common/wallet-config';
import { TestCategory, TestPriority, TestStream, createTestAnnotation } from '@trezor/e2e-utils';

import { buildTrxFrozenAccountState, trxToSun } from '../../fixtures/staking/trx-staking-accounts';
import { expect, test } from '../../support/fixtures';
import { BlockbookMock } from '../../support/mocks/blockBookMock';

const ethSymbol = asNetworkSymbol('eth');
const solSymbol = asNetworkSymbol('sol');
const adaSymbol = asNetworkSymbol('ada');
const trxSymbol = asNetworkSymbol('trx');

const TRX_STAKE_AMOUNT = '100';
const FREEZE_TXID = '0e47dc1def1a4c96e23e298ca2af8a1d6ab58747b6c830505d2d0a9505c832b0';
// At a dollar per coin: the Ethereum fixture holds 3,234 ETH staked with 300 ETH pending, the Tron
// account 100 TRX frozen.
const EXPECTED_TOTAL_BALANCE = /\$\s?3,634\s?\.00/;

test.describe('Staking - Earn dashboard', { tag: ['@T3W1', '@T3T1', '@webOnly'] }, () => {
    test.use({
        deviceSetup: {
            mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
        },
    });

    // One Blockbook mock serves one network: the fixture's serves Ethereum, this one Tron.
    let tronMock: BlockbookMock;

    test.beforeEach(
        async ({
            onboardingPage,
            settingsPage,
            blockbookMock,
            earnStakingApiMock: _earnStakingApiMock,
        }) => {
            await onboardingPage.completeOnboarding();

            await test.step('Enable Ethereum with a staked account and Tron with a frozen one', async () => {
                await blockbookMock.start('eth');
                blockbookMock.updateCurrentFiatRate(1);

                tronMock = new BlockbookMock();
                await tronMock.start('trx');
                tronMock.updateAccountState(
                    buildTrxFrozenAccountState({
                        stakeAmount: TRX_STAKE_AMOUNT,
                        stakeAmountSun: trxToSun(TRX_STAKE_AMOUNT),
                        freezeTxid: FREEZE_TXID,
                    }),
                );
                tronMock.updateCurrentFiatRate(1);

                await settingsPage.changeNetworks({
                    enableNetworks: [
                        {
                            symbol: ethSymbol,
                            backend: { type: 'blockbook', url: blockbookMock.url },
                        },
                        { symbol: trxSymbol, backend: { type: 'blockbook', url: tronMock.url } },
                    ],
                });
            });
        },
    );

    test.afterEach(() => {
        tronMock.stop();
    });

    test(
        'User sees every staking account and opportunity on the Earn dashboard',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that the Earn dashboard lists each staking account with its status and controls, offers the supported networks without an account, and totals the stakes.',
                category: TestCategory.Staking,
                priority: TestPriority.High,
                stream: TestStream.Earn,
            }),
        },
        async ({ yieldSection, earnStakingDashboardSection }) => {
            await test.step('Open the Earn dashboard', async () => {
                await yieldSection.earnMenuButton.click();
            });

            await test.step('The Ethereum account shows its stake and can stake more', async () => {
                const row = earnStakingDashboardSection.accountRow(ethSymbol);

                await expect(earnStakingDashboardSection.rateOf(row)).toBeVisible();
                await expect(earnStakingDashboardSection.stakedAmountOf(row)).toBeVisible();
                await expect(earnStakingDashboardSection.stakeMoreButtonOf(row)).toHaveTranslation(
                    'TR_EARN_STAKING_DASHBOARD_STAKE_MORE',
                );
            });

            await test.step('The frozen Tron account has votes left to assign', async () => {
                const row = earnStakingDashboardSection.accountRow(trxSymbol);

                await expect(earnStakingDashboardSection.voteButtonOf(row)).toHaveTranslation(
                    'TR_EARN_TRON_VOTE',
                );
            });

            await test.step('The networks without an account can be activated', async () => {
                await expect(earnStakingDashboardSection.activateRow(solSymbol)).toBeVisible();
                await expect(earnStakingDashboardSection.activateRow(adaSymbol)).toBeVisible();
            });

            await test.step('The header totals the stakes', async () => {
                await expect(earnStakingDashboardSection.totalBalance).toHaveText(
                    EXPECTED_TOTAL_BALANCE,
                );
            });
        },
    );
});
