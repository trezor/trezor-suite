import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Account tokens', { tag: ['@group=manual'] }, () => {
    test(
        'Tokens tab - tokens, DeFi and inactive tokens',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that the Tokens tab lists tokens, DeFi positions and inactive tokens correctly.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite',
                    'EVM account holding tokens, DeFi positions and tokens without a market price',
                ],
                steps: [
                    'Navigate to the EVM account and open the "Tokens" tab',
                    'Confirm known tokens are listed with balance, price and fiat value',
                    'Click a token and confirm its detail/transactions open',
                    'Open the "DeFi" section and confirm DeFi positions are listed with their values',
                    'Confirm tokens without a reliable market price are grouped under hidden tokens',
                    'Confirm an hidden token can be made active and vice versa',
                ],
                category: TestCategory.Accounts,
                priority: TestPriority.High,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );

    test(
        'Stellar tokens - activation and deactivation',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a Stellar token (trustline) can be activated and deactivated.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite',
                    'Funded Stellar account with enough XLM above the reserve to establish a trustline',
                ],
                steps: [
                    'Navigate to the Stellar account and open the "Tokens" tab',
                    'Start the token activation flow and select/enter the token (asset) to activate',
                    'Confirm the activation communicates the increased reserve requirement',
                    'Confirm the trustline transaction on the Trezor device',
                    'Confirm the activated token appears in the tokens list',
                    'Receive the token and confirm the balance is displayed',
                    'Send the whole token balance away (deactivation requires zero balance)',
                    'Start the token deactivation flow and confirm the trustline removal on the device',
                    'Confirm the token disappears from the list and the reserved XLM is released',
                ],
                category: TestCategory.Accounts,
                priority: TestPriority.High,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );
});
