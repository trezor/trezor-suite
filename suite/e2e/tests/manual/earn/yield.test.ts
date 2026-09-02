import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Yield', { tag: ['@group=manual'] }, () => {
    test(
        'Yield deposit with ETH wrap and approval flow',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can deposit into a yield opportunity, including wrapping ETH and token approval.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite',
                    'Funded Ethereum account (ETH without prior approval for the yield contract)',
                ],
                steps: [
                    'Navigate to the "Earn" page and select a yield opportunity for ETH',
                    'Start the "Deposit" flow and fill in an amount',
                    'Confirm the flow offers wrapping ETH (ETH → WETH) as the first step',
                    'Confirm the wrap transaction on the Trezor device',
                    'Confirm the approval step is required and start it',
                    'Confirm the approval transaction on the device',
                    'Confirm the deposit step follows and approve the deposit transaction on the device',
                    'Confirm the confirmation page shows the "from" and "to" values correctly',
                    'Confirm all transactions appear in history and the deposited position is displayed in the yield overview',
                ],
                category: TestCategory.ETH,
                priority: TestPriority.High,
                stream: TestStream.Earn,
            }),
        },
        async () => {},
    );

    test(
        'Yield withdraw with ETH unwrap',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can withdraw from a yield position, including unwrapping WETH back to ETH.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite',
                    'Ethereum account with an active yield position',
                ],
                steps: [
                    'Navigate to the yield position and start the "Withdraw" flow',
                    'Fill in the amount to withdraw (check percentage/Max buttons)',
                    'Confirm the withdraw transaction on the Trezor device',
                    'Confirm the flow offers unwrapping (WETH → ETH)',
                    'Confirm the unwrap transaction on the device',
                    'Confirm the withdrawn ETH is added to the available account balance',
                ],
                category: TestCategory.ETH,
                priority: TestPriority.High,
                stream: TestStream.Earn,
            }),
        },
        async () => {},
    );

    test(
        'Yield claim rewards',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can claim yield rewards.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite',
                    'Ethereum account with a yield position and claimable rewards',
                ],
                steps: [
                    'Navigate to the yield position with claimable rewards',
                    'Click "Claim rewards"',
                    'Confirm the claim transaction on the Trezor device',
                    'Confirm the claim transaction appears in history',
                    'Confirm the claimed rewards are reflected in the account balance and the position rewards reset',
                ],
                category: TestCategory.ETH,
                priority: TestPriority.Medium,
                stream: TestStream.Earn,
            }),
        },
        async () => {},
    );
});
