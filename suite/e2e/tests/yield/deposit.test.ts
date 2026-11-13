import { events } from '@suite-common/analytics';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { TestStream } from '@trezor/e2e-utils';

import ETH_BASE_TX from '../../fixtures/staking/eth-base-tx.json';
import ETH_STAKE_CONFIRMED_TX from '../../fixtures/staking/eth-stake-confirmed-tx.json';
import { expect, test } from '../../support/fixtures';
import { ETH_MOCKED_ACCOUNT } from '../../support/mocks/eth-endpoints';
import {
    YIELD_NEW_BLOCK,
    YIELD_USDC_VAULT_SHARE_TOKEN,
    YIELD_VAULTS,
} from '../../support/mocks/yieldMock';
import { createTestAnnotation } from '../../support/reporters/annotations';

const { usdcPrime, usdtPrime } = YIELD_VAULTS;
const YIELD_USDC_VAULT_DISPLAY_NAME = ['Trezor Steakhouse', '\n', 'USDC Prime Vault'];
const EXPECT_YIELD_DASHBOARD_ROWS = [usdcPrime, usdtPrime];
// The toast shows the approved amount compactly, and a stablecoin reads money-like.
const COMPACT_APPROVED_AMOUNT = '10.00';
const APPROVE_MAX_FEE = '0.00003161748342375 ETH';
const DEPOSIT_MAX_FEE = '0.00010840280031 ETH';

const VAULT_CONTEXT = { networkSymbol: 'eth', vaultId: usdcPrime.id };
const DEPOSIT_CONTEXT = { ...VAULT_CONTEXT, action: 'continue' };
const APY_BREAKDOWN = usdcPrime.apyBreakdown.analyticsAttribute;
const DASHBOARD_CONTEXT = {
    hasStakingPosition: 'true',
    hasClaimBanner: 'false',
    availableVaultCount: String(Object.keys(YIELD_VAULTS).length),
    availableStakingCount: '4',
    hasShowMore: 'false',
};

const FEEDBACK_RATING = '5';

const DEPOSIT_TXID = '0x1111111111111111111111111111111111111111111111111111111111111111';

test.describe('stablecoin yield', { tag: ['@webOnly', '@T3W1', '@T3T1'] }, () => {
    test.use({
        deviceSetup: {
            mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
        },
    });

    test.beforeEach(
        async ({ analytics, onboardingPage, settingsPage, blockbookMock, yieldMock }) => {
            await analytics.interceptAnalytics();
            await onboardingPage.completeOnboarding();
            await blockbookMock.start('eth');
            await yieldMock.start();
            await settingsPage.changeNetworks({
                enableNetworks: [
                    {
                        symbol: asNetworkSymbol('eth'),
                        backend: { type: 'blockbook', url: blockbookMock.url },
                    },
                ],
            });
        },
    );

    test(
        'User can deposit USDC into a yield vault',
        { annotation: createTestAnnotation({ stream: TestStream.Earn }) },
        async ({
            analytics,
            page,
            walletPage,
            yieldSection,
            yieldFlowSection,
            earnNutshellModal,
            yieldConsentModal,
            txSimulationModal,
            devicePrompt,
            device,
            blockbookMock,
            yieldMock,
            toastSection,
        }) => {
            const earnEntryEvents = analytics.trackEvents(events.yieldEarnEntryEvent.name);
            const dashboardReadyEvents = analytics.trackEvents(events.earnDashboardReadyEvent.name);
            const navigateEvents = analytics.trackEvents(events.yieldNavigateEvent.name);
            const interactionEvents = analytics.trackEvents(events.yieldInteractionEvent.name);
            const depositEvents = analytics.trackEvents(events.yieldDepositEvent.name);

            await test.step('Check yield dashboard', async () => {
                await yieldSection.earnMenuButton.click();
                await earnEntryEvents.expectNext({ from: 'settings-coins' });
                await dashboardReadyEvents.expectNext({
                    ...DASHBOARD_CONTEXT,
                    hasYieldPosition: 'false',
                });

                const ethAccountName = await walletPage
                    .accountLabel({ symbol: asNetworkSymbol('eth'), type: 'normal', atIndex: 0 })
                    .innerText();

                await expect(yieldSection.yieldTitle).toHaveTranslation('TR_EARN_DEFI_YIELD');

                for (const expectedRow of EXPECT_YIELD_DASHBOARD_ROWS) {
                    await expect(yieldSection.accountLabel(expectedRow.id)).toHaveText(
                        ethAccountName,
                    );
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
                await interactionEvents.expectNext({ ...VAULT_CONTEXT, element: 'apy-tooltip' });
            });

            await yieldSection.clickDepositNow(usdcPrime.id);
            await navigateEvents.expectNext({
                ...VAULT_CONTEXT,
                action: 'continue',
                from: 'earn-dashboard',
                to: 'deposit-in-a-nutshell-modal',
            });

            await test.step('Check earn-in-a-nutshell modal', async () => {
                await expect(earnNutshellModal.heading).toHaveTranslation(
                    'TR_EARN_DEFI_YIELD_IN_A_NUTSHELL',
                );
                await expect(earnNutshellModal.withdrawProcess).toBeVisible();
                await expect(earnNutshellModal.claimProcess).toBeVisible();

                await earnNutshellModal.depositProcess.click();
                await expect(earnNutshellModal.depositApyValue).toHaveTranslation(
                    'TR_EARN_APY_APPROX',
                    { values: { apyPercent: usdcPrime.apyBreakdown.apyPercent } },
                );
                // The process tab reports once its expand animation finishes, so let it
                // finish before leaving the modal.
                await interactionEvents.expectNext({
                    ...VAULT_CONTEXT,
                    element: 'in-a-nutshell-process-tab',
                    value: 'deposit',
                });
                await earnNutshellModal.continueButton.click();
                await navigateEvents.expectNext({
                    ...VAULT_CONTEXT,
                    action: 'continue',
                    from: 'deposit-in-a-nutshell-modal',
                    to: 'deposit-legal-modal',
                });
            });

            await test.step('Check consent modal', async () => {
                await expect(yieldConsentModal.heading).toHaveTranslation('TR_EARN_DEPOSIT_TOKEN', {
                    values: { symbol: 'USDC' },
                });
                await yieldConsentModal.acknowledgeCheckbox.click();
                await yieldConsentModal.confirmButton.click();
                await navigateEvents.expectNext({
                    ...VAULT_CONTEXT,
                    action: 'continue',
                    from: 'deposit-legal-modal',
                    to: 'deposit-form',
                });
            });

            await test.step('How it works reopens the earn-in-a-nutshell modal', async () => {
                await yieldFlowSection.howItWorksButton.click();
                await interactionEvents.expectNext({
                    ...VAULT_CONTEXT,
                    element: 'how-it-works',
                    value: 'yield-deposit',
                });
                await expect(earnNutshellModal.heading).toHaveTranslation(
                    'TR_EARN_DEFI_YIELD_IN_A_NUTSHELL',
                );
                await expect(earnNutshellModal.cancelButton).toBeHidden();

                await earnNutshellModal.continueButton.click();
                await expect(earnNutshellModal.modalContainer).toBeHidden();
            });

            await test.step('Amount can be entered in fiat', async () => {
                await expect(yieldFlowSection.fiatSwitch).toHaveTranslation('TR_ENTER_AMOUNT_IN', {
                    values: { currency: 'USD' },
                });
                await yieldFlowSection.fiatSwitch.click();
                await interactionEvents.expectNext({
                    ...VAULT_CONTEXT,
                    element: 'amount-currency-toggle',
                    value: 'fiat',
                });
                await expect(yieldFlowSection.fiatInput).toBeVisible();
                await expect(yieldFlowSection.amountInput).toBeHidden();

                await expect(yieldFlowSection.fiatSwitch).toHaveTranslation('TR_ENTER_AMOUNT_IN', {
                    values: { currency: 'USDC' },
                });
                await yieldFlowSection.fiatSwitch.click();
                await interactionEvents.expectNext({
                    ...VAULT_CONTEXT,
                    element: 'amount-currency-toggle',
                    value: 'crypto',
                });
                await expect(yieldFlowSection.amountInput).toBeVisible();
                await expect(yieldFlowSection.fiatInput).toBeHidden();
            });

            await test.step('Approve USDC spending', async () => {
                await page.clock.install();
                await yieldMock.mockUsdcDeposit();

                await expect(yieldFlowSection.approveButton).toBeDisabled();

                await yieldFlowSection.maxButton.click();
                await interactionEvents.expectNext({ ...VAULT_CONTEXT, element: 'deposit-max' });
                await expect(yieldFlowSection.amountInput).toHaveValue('1,000');

                await yieldFlowSection.amountInput.fill('1001');
                await expect(yieldFlowSection.approveOverBalanceWarning).toContainTranslation(
                    'TR_APPROVE_OVER_BALANCE',
                );
                await expect(yieldFlowSection.approveButton).toBeEnabled();

                await yieldFlowSection.amountInput.fill('10');
                await expect(yieldFlowSection.approveOverBalanceWarning).toBeHidden();
                await yieldFlowSection.approveButton.click();
                await depositEvents.expectNext({
                    ...DEPOSIT_CONTEXT,
                    type: 'approve',
                    deviceStatus: 'connected',
                });
                await yieldFlowSection.approveModalContinueButton.click();
                await depositEvents.expectNext({
                    ...DEPOSIT_CONTEXT,
                    type: 'approve-modal',
                    approvalType: 'MINIMAL',
                });
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
                await expect(devicePrompt.cryptoAmountWithSymbolOf('fee')).toHaveText(
                    APPROVE_MAX_FEE,
                );
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Token approval' },
                        body: [
                            ['Maximum fee'],
                            device.wrapText(APPROVE_MAX_FEE, { isAmount: true }),
                        ],
                        actions: { right_button: 'Hold to sign' },
                    },
                    T3T1: {
                        header: { title: 'Summary' },
                    },
                });
                await devicePrompt.waitForFinalPromptAndConfirm();
                await devicePrompt.sendButton.click();
                await expect(toastSection.approvedMessage).toHaveTranslation('TOAST_TX_APPROVED');
                await expect(toastSection.approvedAmount).toHaveText(
                    `${COMPACT_APPROVED_AMOUNT}USDC`,
                );
                await expect(yieldFlowSection.pendingTransactionLabel).toHaveTranslation(
                    'TR_EXCHANGE_APPROVAL_FORM_CONFIRMING_APPROVAL',
                );
                blockbookMock.updateAccountState({
                    txs: 2,
                    transactions: [ETH_STAKE_CONFIRMED_TX, ETH_BASE_TX],
                });
                blockbookMock.updateAllowance('10000000'); // 10 USDC
                await page.clock.fastForward('01:00');
                await depositEvents.expectNext({
                    ...DEPOSIT_CONTEXT,
                    type: 'approve-success',
                    durationMs: expect.stringMatching(/^\d+$/),
                });
            });

            await test.step('Deposit USDC', async () => {
                blockbookMock.setBroadcastTxid(DEPOSIT_TXID);
                await expect(yieldFlowSection.approvedAmount).toHaveText('10 USDC');
                await yieldFlowSection.depositButton.click();
                await depositEvents.expectNext({
                    ...DEPOSIT_CONTEXT,
                    type: 'deposit',
                    deviceStatus: 'connected',
                    wrappedNative: 'false',
                    apyBreakdown: APY_BREAKDOWN,
                });
                await expect(txSimulationModal.sentAsset(0)).toHaveText('Sending 10 USDC');
                await expect(txSimulationModal.sentAssetFiat(0)).toHaveText('-$10.00');
                await expect(txSimulationModal.receivedAsset(0)).toHaveText(
                    'Receiving 9.944 trSHUSDCp',
                );
                await expect(txSimulationModal.receivedAssetFiat(0)).toHaveText('+$10.00');
                await expect(txSimulationModal.maxFeeAmount).toHaveText('0.000108403 ETH');
                await expect(txSimulationModal.maxFeeFiat).toHaveText('≈ $0.00');
                await txSimulationModal.confirmButton.click();
                await depositEvents.expectNext({ ...DEPOSIT_CONTEXT, type: 'tx-simulation-modal' });
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
                        body: [['Deposit to'], YIELD_USDC_VAULT_DISPLAY_NAME],
                        actions: { right_button: 'Continue' },
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
                await expect(devicePrompt.cryptoAmountWithSymbolOf('fee')).toHaveText(
                    DEPOSIT_MAX_FEE,
                );
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Deposit' },
                        body: [
                            ['Maximum fee'],
                            device.wrapText(DEPOSIT_MAX_FEE, { isAmount: true }),
                        ],
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
                depositEvents.expectNone();

                await yieldFlowSection.pendingTransactionId.click();
                await interactionEvents.expectNext({
                    ...VAULT_CONTEXT,
                    element: 'pending-tx-open',
                    value: 'deposit',
                });
                await expect(yieldFlowSection.transactionDetailTxid).toHaveText(DEPOSIT_TXID);
                await page.modalCloseButton.click();

                blockbookMock.updateAccountState({
                    transactions: [
                        { ...ETH_STAKE_CONFIRMED_TX, txid: DEPOSIT_TXID },
                        ETH_STAKE_CONFIRMED_TX,
                        ETH_BASE_TX,
                    ],
                });
                await blockbookMock.sendNewBlockNotification(YIELD_NEW_BLOCK);

                await expect(yieldFlowSection.flowCompleteHeading).toHaveTranslation(
                    'TR_EARN_YIELD_DEPOSIT_COMPLETE',
                );
                await expect(yieldFlowSection.flowCompleteStatus).toHaveTranslation(
                    'TR_EARN_YIELD_COMPLETED',
                );
                await expect(yieldFlowSection.flowCompleteApy).toHaveText(usdcPrime.apy);
                await expect(yieldFlowSection.flowCompleteTransferInputAmount).toHaveText(
                    '10 USDC',
                );
                // Output shares render at full token precision, not the rounded simulation
                // preview shown earlier in the flow.
                await expect(yieldFlowSection.flowCompleteTransferOutputAmount).toHaveText(
                    '9.944238455556494028 trSHUSDCp',
                );
                await depositEvents.expectNext({
                    ...DEPOSIT_CONTEXT,
                    type: 'success',
                    wrappedNative: 'false',
                    apyBreakdown: APY_BREAKDOWN,
                    durationMs: expect.stringMatching(/^\d+$/),
                });
            });

            await test.step('Deposit flow can be rated', async () => {
                await page.route('**://data.trezor.io/suite/feedback/**', route =>
                    route.fulfill({ headers: { 'access-control-allow-origin': '*' } }),
                );
                await yieldFlowSection.feedbackRating(FEEDBACK_RATING).click();
                await yieldFlowSection.feedbackFormTextarea.fill('E2E test feedback');
                await yieldFlowSection.feedbackFormSubmitButton.click();
                await expect(yieldFlowSection.feedbackFormSubmitButton).toBeHidden();
                await interactionEvents.expectNext({
                    element: 'feedback-submit',
                    value: FEEDBACK_RATING,
                    vaultId: usdcPrime.id,
                });
            });

            await test.step('Returning to the dashboard shows the deposited position', async () => {
                await yieldFlowSection.backToOverviewButton.click();
                await navigateEvents.expectNext({
                    ...VAULT_CONTEXT,
                    action: 'continue',
                    from: 'deposit-form',
                    to: 'earn-dashboard',
                });
                await earnEntryEvents.expectNext({ from: 'earn-yield-deposit' });
                await dashboardReadyEvents.expectNext({
                    ...DASHBOARD_CONTEXT,
                    hasYieldPosition: 'true',
                });

                // The vault row now offers deposit-more + withdraw actions instead of "Deposit now".
                await expect(yieldSection.withdrawButton(usdcPrime.id)).toBeVisible();
                await expect(yieldSection.depositMoreButton(usdcPrime.id)).toBeVisible();
                await expect(yieldSection.depositNowButton(usdcPrime.id)).toBeHidden();
            });
        },
    );
});
