import ETH_BASE_TX from '../../fixtures/staking/eth-base-tx.json';
import ETH_STAKE_CONFIRMED_TX from '../../fixtures/staking/eth-stake-confirmed-tx.json';
import { expect, test } from '../../support/fixtures';
import { ETH_MOCKED_ACCOUNT } from '../../support/mocks/eth-endpoints';
import { YIELD_USDC_VAULT_SHARE_TOKEN, YIELD_VAULTS } from '../../support/mocks/yieldMock';

const { usdcPrime, usdtPrime } = YIELD_VAULTS;
const YIELD_USDC_VAULT_DISPLAY_NAME = ['Trezor Steakhouse', '\n', 'USDC Prime Vault'];
const EXPECT_YIELD_DASHBOARD_ROWS = [usdcPrime, usdtPrime];
const APPROVE_MAX_FEE = '0.00003161748342375 ETH';
const DEPOSIT_MAX_FEE = '0.00010840280031 ETH';

test.describe('stablecoin yield', { tag: ['@webOnly', '@T3W1', '@T3T1'] }, () => {
    test.use({
        deviceSetup: {
            mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
        },
    });

    test.beforeEach(async ({ onboardingPage, settingsPage, blockbookMock, yieldMock }) => {
        await onboardingPage.completeOnboarding();
        await blockbookMock.start('eth');
        await yieldMock.start();
        await settingsPage.changeNetworks({
            enableNetworks: [
                { symbol: 'eth', backend: { type: 'blockbook', url: blockbookMock.url } },
            ],
        });
    });

    test('User can deposit USDC into a yield vault', async ({
        page,
        walletPage,
        yieldSection,
        yieldFlowSection,
        yieldNutshellModal,
        yieldConsentModal,
        txSimulationModal,
        devicePrompt,
        device,
        blockbookMock,
        yieldMock,
        toastSection,
    }) => {
        await test.step('Check yield dashboard', async () => {
            await yieldSection.earnMenuButton.click();

            const ethAccountName = await walletPage
                .accountLabel({ symbol: 'eth', type: 'normal', atIndex: 0 })
                .innerText();

            await expect(yieldSection.yieldTitle).toHaveTranslation('TR_EARN_DEFI_YIELD_TITLE');

            for (const expectedRow of EXPECT_YIELD_DASHBOARD_ROWS) {
                await expect(yieldSection.accountLabel(expectedRow.id)).toHaveText(ethAccountName);
                await expect(yieldSection.vaultSubtitle(expectedRow.id)).toHaveText(
                    expectedRow.name,
                );
                await expect(yieldSection.apyPercentage(expectedRow.id)).toHaveText(
                    expectedRow.apy,
                );
                await expect(yieldSection.yearlyRewardAmount(expectedRow.id)).toHaveText(
                    expectedRow.yearlyReward,
                );
                await expect(yieldSection.potentialRewardAmount(expectedRow.id)).toHaveText(
                    expectedRow.potentialReward,
                );
            }
        });

        await test.step('Check APY breakdown tooltip', async () => {
            await yieldSection.hoverApyPercentage(usdcPrime.id);

            const { symbols, rates } = usdcPrime.apyBreakdown;
            await expect(yieldSection.apyBreakdownSymbols).toHaveText([...symbols]);
            await expect(yieldSection.apyBreakdownRates).toHaveText([...rates]);
            await expect(yieldSection.apyBreakdownDescriptions).toHaveTranslation([
                'TR_EARN_YIELD_APY_SOURCE_LENDING_INTEREST',
                'TR_EARN_YIELD_APY_SOURCE_PROTOCOL_INCENTIVE',
            ]);
            await expect(yieldSection.apyBreakdownFooter).toHaveTranslation(
                'TR_EARN_YIELD_APY_APR_TOOLTIP_FOOTER',
            );
        });

        await yieldSection.clickDepositNow(usdcPrime.id);

        await test.step('Check earn-in-a-nutshell modal', async () => {
            await expect(yieldNutshellModal.heading).toHaveTranslation(
                'TR_EARN_DEFI_YIELD_IN_A_NUTSHELL',
            );
            await expect(yieldNutshellModal.withdrawProcess).toBeVisible();
            await expect(yieldNutshellModal.claimProcess).toBeVisible();

            await yieldNutshellModal.depositProcess.click();
            await expect(yieldNutshellModal.depositApyValue).toHaveTranslation(
                'TR_EARN_APY_APPROX',
                { values: { apyPercent: usdcPrime.apyBreakdown.apyPercent } },
            );
            await yieldNutshellModal.continueButton.click();
        });

        await test.step('Check consent modal', async () => {
            await expect(yieldConsentModal.heading).toHaveTranslation('TR_EARN_DEPOSIT_TOKEN', {
                values: { symbol: 'USDC' },
            });
            await yieldConsentModal.acknowledgeCheckbox.click();
            await yieldConsentModal.confirmButton.click();
        });

        await test.step('Approve USDC spending', async () => {
            await page.clock.install();
            await yieldMock.mockUsdcDeposit();
            await yieldFlowSection.amountInput.fill('10');
            await yieldFlowSection.approveButton.click();
            await yieldFlowSection.approveModalContinueButton.click();
            await devicePrompt.confirmOnDevicePromptIsShown();
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: 'Token approval' },
                    body: [['Review details to', '\n', 'approve token', '\n', 'spending.']],
                    actions: { right_button: 'Continue' },
                },
            });
            await devicePrompt.waitForPromptAndClick();
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: 'Token approval' },
                    body: [YIELD_USDC_VAULT_DISPLAY_NAME],
                    actions: { right_button: 'Continue' },
                },
                T3T1: {
                    header: { title: 'Approve to' },
                },
            });
            await device.pressYes();
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: 'Token approval' },
                    body: [['Amount allowance'], ['10 USDC'], ['Chain'], ['Ethereum']],
                    actions: { right_button: 'Continue' },
                },
                T3T1: {
                    header: { title: 'Approve' },
                },
            });
            await device.pressYes();
            await expect(devicePrompt.cryptoAmountWithSymbolOf('fee')).toHaveText(APPROVE_MAX_FEE);
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: 'Token approval' },
                    body: [['Maximum fee'], device.wrapText(APPROVE_MAX_FEE, { isAmount: true })],
                    actions: { right_button: 'Hold to sign' },
                },
                T3T1: {
                    header: { title: 'Summary' },
                },
            });
            await devicePrompt.waitForFinalPromptAndConfirm();
            await devicePrompt.sendButton.click();
            await expect(toastSection.approved).toBeVisible();
            await expect(toastSection.approvedAmount).toHaveText('10USDC');
            await expect(yieldFlowSection.pendingTransactionLabel).toHaveTranslation(
                'TR_EXCHANGE_APPROVAL_FORM_CONFIRMING_APPROVAL',
            );
            blockbookMock.updateAccountState({
                txs: 2,
                transactions: [ETH_STAKE_CONFIRMED_TX, ETH_BASE_TX],
            });
            blockbookMock.updateAllowance('10000000'); // 10 USDC
            await page.clock.fastForward('01:00');
        });

        await test.step('Deposit USDC', async () => {
            await expect(yieldFlowSection.approvedAmount).toHaveText('10 USDC');
            await yieldFlowSection.depositButton.click();
            await expect(txSimulationModal.sentAsset(0)).toHaveText('Sending 10 USDC');
            await expect(txSimulationModal.sentAssetFiat(0)).toHaveText('-$10.00');
            await expect(txSimulationModal.receivedAsset(0)).toHaveText(
                'Receiving 9.944 trSHUSDCp',
            );
            await expect(txSimulationModal.receivedAssetFiat(0)).toHaveText('+$10.00');
            await expect(txSimulationModal.maxFeeAmount).toHaveText('0.000108403 ETH');
            await expect(txSimulationModal.maxFeeFiat).toHaveText('≈ $0.00');
            await txSimulationModal.confirmButton.click();
            await devicePrompt.confirmOnDevicePromptIsShown();
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: 'Deposit' },
                    body: [['Review details to', '\n', 'deposit to vault.']],
                    actions: { right_button: 'Confirm' },
                },
            });
            await devicePrompt.waitForPromptAndClick();
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: 'Deposit' },
                    body: [YIELD_USDC_VAULT_DISPLAY_NAME],
                    actions: { right_button: 'Continue' },
                },
                T3T1: {
                    body: [['Deposit to'], YIELD_USDC_VAULT_DISPLAY_NAME],
                },
            });
            await device.pressYes();
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: 'Deposit' },
                    body: [['Deposit amount'], ['10 USDC'], ['Chain'], ['Ethereum']],
                    actions: { right_button: 'Continue' },
                },
            });
            await device.pressYes();
            await expect(devicePrompt.cryptoAmountWithSymbolOf('fee')).toHaveText(DEPOSIT_MAX_FEE);
            await expect(device).toShowOnDisplay({
                T3W1: {
                    header: { title: 'Deposit' },
                    body: [['Maximum fee'], device.wrapText(DEPOSIT_MAX_FEE, { isAmount: true })],
                    actions: { right_button: 'Hold to sign' },
                },
            });
            await devicePrompt.waitForFinalPromptAndConfirm();

            blockbookMock.updateAllowance('0');
            blockbookMock.updateAccountState({
                txs: 3,
                nonce: '2',
                tokens: [
                    ...ETH_MOCKED_ACCOUNT.tokens.map(token =>
                        token.symbol === 'USDC' ? { ...token, balance: '990000000' } : token,
                    ),
                    YIELD_USDC_VAULT_SHARE_TOKEN,
                ],
            });
            await devicePrompt.sendButton.click();
            await expect(toastSection.yieldDeposit).toBeVisible();
            await expect(yieldFlowSection.flowCompleteHeading).toHaveTranslation(
                'TR_EARN_YIELD_DEPOSIT_COMPLETE',
            );
            await expect(yieldFlowSection.flowCompleteStatus).toHaveTranslation(
                'TR_EARN_YIELD_COMPLETED',
            );
            await expect(yieldFlowSection.flowCompleteApy).toHaveText(usdcPrime.apy);
            await expect(yieldFlowSection.flowCompleteTransferInputAmount).toHaveText('10 USDC');
            // Output shares render at full token precision via formatCoinBalance (8 fractional
            // digits + ellipsis), not the rounded simulation preview shown earlier in the flow.
            await expect(yieldFlowSection.flowCompleteTransferOutputAmount).toHaveText(
                '9.94423845… trSHUSDCp',
            );

            await blockbookMock.sendNewBlockNotification({
                // One block above bestHeight of the getInfo fixture in eth-endpoints.
                height: 22881954,
                hash: '0xa07d0d92b6bb9a5f388d47a10b824b4b09e0b3aeb08d0f61c0e30a25f6c8455f',
            });
        });

        await test.step('Returning to the dashboard shows the deposited position', async () => {
            await yieldFlowSection.backToOverviewButton.click();

            // The vault row now offers deposit-more + withdraw actions instead of "Deposit now".
            await expect(yieldSection.withdrawButton(usdcPrime.id)).toBeVisible();
            await expect(yieldSection.depositMoreButton(usdcPrime.id)).toBeVisible();
            await expect(yieldSection.depositNowButton(usdcPrime.id)).toBeHidden();
        });
    });
});
