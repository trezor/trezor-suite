import { parseEther, parseUnits } from 'viem';

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import {
    USDC_CONTRACT,
    YIELD_USDC_VAULT_ADDRESS,
    YIELD_VAULTS,
} from '../../support/mocks/yieldMock';
import { createTestAnnotation } from '../../support/reporters/annotations';

const ethSymbol = asNetworkSymbol('eth');
// A seed generated for this test, so its address has no mainnet history: no tokens, allowances or
// vault shares that the fork would carry over.
const mnemonic = 'depart coconut stage worth exact secret swap dose sheriff lizard mercy aware';
// Ethereum #1 of the mnemonic above (m/44'/60'/0'/0/0)
const ownerAddress = '0x55B55c9480f8bA8a848d14b395f9147260aa7e2b';
const usdcDecimals = 6;
const fundedUsdc = parseUnits('1000', usdcDecimals);
const depositAmount = '10';
const depositSubunits = parseUnits(depositAmount, usdcDecimals);
const { usdcPrime } = YIELD_VAULTS;
const YIELD_USDC_VAULT_DISPLAY_NAME = ['Trezor Steakhouse', '\n', 'USDC Prime Vault'];
// Suite learns about confirmations by polling, so the clock is moved on until it sees one.
const CONFIRMATION_FAST_FORWARD = '00:30';
const CONFIRMATION_TIMEOUT = 60_000;
// 10 USDC at the mocked pricePerShare (1.005607422297114), as tests/yield/deposit.test.ts shows it.
const MOCKED_PRICE_RECEIVED_SHARES = '9.944238455556494028';

test.describe('stablecoin yield on a mainnet fork', { tag: ['@webOnly', '@T3W1', '@T3T1'] }, () => {
    test.use({ deviceSetup: { mnemonic } });

    test.beforeEach(async ({ anvil, onboardingPage, settingsPage, walletPage, yieldMock }) => {
        // Native balance before discovery, so Suite finds the account.
        await anvil.setBalance(ownerAddress, parseEther('1'));
        await onboardingPage.completeOnboarding();
        // Vault metadata and the Blockaid simulation stay mocked; the transactions are real.
        await yieldMock.start();
        await settingsPage.changeNetworks({
            enableNetworks: [anvil.networkToEnable],
        });
        await walletPage.openAccount({ symbol: ethSymbol });
        // USDC only once Suite watches the account: on evm-rpc it learns about tokens from Transfer
        // logs in new blocks, while its scan of older blocks goes through the fork's upstream RPC.
        await anvil.fundErc20(USDC_CONTRACT, ownerAddress, fundedUsdc);
    });

    test(
        'User can deposit USDC into a yield vault and the deposit is executed on chain',
        { annotation: createTestAnnotation({ stream: TestStream.Earn }) },
        async ({
            page,
            anvil,
            walletPage,
            yieldSection,
            yieldFlowSection,
            earnNutshellModal,
            yieldConsentModal,
            txSimulationModal,
            devicePrompt,
            device,
            yieldMock,
            toastSection,
        }) => {
            const sharesBefore = await anvil.readErc20Balance(
                YIELD_USDC_VAULT_ADDRESS,
                ownerAddress,
            );

            await test.step('Open the USDC Prime vault deposit', async () => {
                await yieldSection.earnMenuButton.click();
                const ethAccountName = await walletPage
                    .accountLabel({ symbol: ethSymbol, type: 'normal', atIndex: 0 })
                    .innerText();
                await expect(yieldSection.accountLabel(usdcPrime.id)).toHaveText(ethAccountName);
                // The worker polls for new transfers every 10 s in real time, out of page.clock's reach.
                await expect(yieldSection.depositNowButton(usdcPrime.id)).toBeVisible({
                    timeout: 30_000,
                });
                await yieldSection.clickDepositNow(usdcPrime.id);
                await earnNutshellModal.continueButton.click();
                await yieldConsentModal.acknowledgeCheckbox.click();
                await yieldConsentModal.confirmButton.click();
            });

            await test.step('Approve USDC spending', async () => {
                await page.clock.install();
                await yieldMock.mockUsdcDeposit();

                await yieldFlowSection.amountInput.fill(depositAmount);
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
                const approveMaxFee = await devicePrompt
                    .cryptoAmountWithSymbolOf('fee')
                    .innerText();
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Token approval' },
                        body: [['Maximum fee'], device.wrapText(approveMaxFee, { isAmount: true })],
                        actions: { right_button: 'Hold to sign' },
                    },
                    T3T1: {
                        header: { title: 'Summary' },
                    },
                });
                await devicePrompt.waitForFinalPromptAndConfirm();
                await devicePrompt.sendButton.click();
                await expect(toastSection.approvedMessage).toHaveTranslation('TOAST_TX_APPROVED');
            });

            await test.step('Approval is executed on chain', async () => {
                await expect
                    .poll(
                        () =>
                            anvil.readErc20Allowance(
                                USDC_CONTRACT,
                                ownerAddress,
                                YIELD_USDC_VAULT_ADDRESS,
                            ),
                        'vault should be allowed to spend the approved amount',
                    )
                    .toBe(depositSubunits);
                await expect(async () => {
                    await page.clock.fastForward(CONFIRMATION_FAST_FORWARD);
                    await expect(yieldFlowSection.approvedAmount).toHaveText(
                        `${depositAmount} USDC`,
                    );
                }, 'Suite should pick up the confirmed approval').toPass({
                    timeout: CONFIRMATION_TIMEOUT,
                });
            });

            await test.step('Deposit USDC', async () => {
                await yieldFlowSection.depositButton.click();
                await expect(txSimulationModal.sentAsset(0)).toHaveText(
                    `Sending ${depositAmount} USDC`,
                );
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
                const depositMaxFee = await devicePrompt
                    .cryptoAmountWithSymbolOf('fee')
                    .innerText();
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Deposit' },
                        body: [['Maximum fee'], device.wrapText(depositMaxFee, { isAmount: true })],
                        actions: { right_button: 'Hold to sign' },
                    },
                });
                await devicePrompt.waitForFinalPromptAndConfirm();
                await devicePrompt.sendButton.click();
                await expect(toastSection.yieldDeposit).toBeVisible();
            });

            await test.step('Deposit is executed on chain', async () => {
                await expect
                    .poll(
                        () => anvil.readErc20Balance(USDC_CONTRACT, ownerAddress),
                        'deposited USDC should leave the account',
                    )
                    .toBe(fundedUsdc - depositSubunits);
                await expect(
                    anvil.readErc20Allowance(USDC_CONTRACT, ownerAddress, YIELD_USDC_VAULT_ADDRESS),
                ).resolves.toBe(0n);
            });

            await test.step('Suite shows the completed deposit', async () => {
                const sharesAfter = await anvil.readErc20Balance(
                    YIELD_USDC_VAULT_ADDRESS,
                    ownerAddress,
                );
                expect(sharesAfter, 'vault should mint shares for the deposit').toBeGreaterThan(
                    sharesBefore,
                );
                const { symbol } = await anvil.readErc20Metadata(YIELD_USDC_VAULT_ADDRESS);

                await expect(async () => {
                    await page.clock.fastForward(CONFIRMATION_FAST_FORWARD);
                    await expect(yieldFlowSection.flowCompleteHeading).toHaveTranslation(
                        'TR_EARN_YIELD_DEPOSIT_COMPLETE',
                    );
                }, 'Suite should pick up the confirmed deposit').toPass({
                    timeout: CONFIRMATION_TIMEOUT,
                });
                await expect(yieldFlowSection.flowCompleteStatus).toHaveTranslation(
                    'TR_EARN_YIELD_COMPLETED',
                );
                await expect(yieldFlowSection.flowCompleteTransferInputAmount).toHaveText(
                    `${depositAmount} USDC`,
                );
                // Suite estimates the received shares before signing, from the vault's price per
                // share in the (mocked) yield metadata, so this follows yieldMock, not the minted
                // amount asserted on chain above. The symbol is the vault's own, read from chain.
                await expect(yieldFlowSection.flowCompleteTransferOutputAmount).toHaveText(
                    `${MOCKED_PRICE_RECEIVED_SHARES} ${symbol}`,
                );
            });

            await test.step('Returning to the dashboard shows the deposited position', async () => {
                await yieldFlowSection.backToOverviewButton.click();
                await expect(async () => {
                    await page.clock.fastForward(CONFIRMATION_FAST_FORWARD);
                    await expect(yieldSection.withdrawButton(usdcPrime.id)).toBeVisible();
                }, 'Suite should list the vault position').toPass({
                    timeout: CONFIRMATION_TIMEOUT,
                });
                await expect(yieldSection.depositMoreButton(usdcPrime.id)).toBeVisible();
                await expect(yieldSection.depositNowButton(usdcPrime.id)).toBeHidden();
            });
        },
    );
});
