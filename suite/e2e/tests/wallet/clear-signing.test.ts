import { TestStream } from '@trezor/e2e-utils';

import { clearSigningScenarios } from '../../fixtures/clearSigning';
import { expect } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';
import { test } from '../../support/testExtends/clearSigningFixture';

test.describe(
    'Clear signing through Suite',
    { tag: ['@T3W1', '@T3T1', '@webOnly', '@nightlyOnly'] },
    () => {
        for (const scenario of clearSigningScenarios) {
            test(
                `User can review and sign ${scenario.name} from the Send form`,
                { annotation: createTestAnnotation({ stream: TestStream.Wallet }) },
                async ({ walletPage, tradingPage, devicePrompt, confirmClearSigning }) => {
                    await walletPage.openAccount({ symbol: 'eth' });
                    await walletPage.openSendFormButton.click();

                    await test.step('Fill the contract call and disable broadcast', async () => {
                        await walletPage.sendHeaderDropdown.click();
                        await walletPage.sendBroadcastOption.click();
                        await walletPage.addTransactionDataButton.click();
                        await tradingPage.sendAddressInput.fill(scenario.transaction.to);
                        await walletPage.transactionDataInput.fill(scenario.transaction.data);
                        await tradingPage.sendAmountInput.fill(scenario.ethAmount);
                        await expect(tradingPage.sendAmountInput).toHaveValue(scenario.ethAmount);
                    });

                    await tradingPage.sendButton.click();

                    await test.step('Review clear-signed details on Trezor', () =>
                        confirmClearSigning(scenario));

                    await expect(devicePrompt.copyRawTransactionButton).toBeEnabled();
                },
            );
        }
    },
);
