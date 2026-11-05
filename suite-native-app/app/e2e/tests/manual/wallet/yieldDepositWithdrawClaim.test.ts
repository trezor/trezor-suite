import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Yield deposit with approval flow',
        {
            testCase:
                'A user can deposit into a yield opportunity including the token approval step',
            prerequisites: [
                'connected device',
                'seed with a yield-eligible EVM account (e.g. stablecoin without prior approval)',
            ],
            steps: [
                'Navigate to the Earn screen and select a yield opportunity',
                'For first-time use, verify the consent/acknowledge screen and confirm it',
                'Start the deposit flow and fill in an amount',
                'Verify the approval step is required, review the approval transaction data and sign it on the device',
                'Continue with the deposit, review the transaction data and sign it on the device',
                'Verify the deposit complete screen and that the position is displayed in the yield overview',
                'Verify insufficient balance is handled correctly when the amount exceeds the balance',
            ],
            category: TestCategory.Earn,
            priority: TestPriority.High,
            stream: TestStream.Earn,
        },
        async () => {},
    );

    it(
        'Yield withdraw and claim rewards',
        {
            testCase: 'A user can withdraw from a yield position and claim rewards',
            prerequisites: [
                'connected device',
                'seed with an active yield position and claimable rewards',
            ],
            steps: [
                'Navigate to the yield position and start the withdraw flow',
                'Fill in the amount to withdraw, review the transaction and sign it on the device',
                'Verify the withdraw complete screen and that the funds are returned to the available balance',
                'Start the claim rewards flow, review the transaction and sign it on the device',
                'Verify the claim complete screen and that the claimed rewards are reflected in the balance',
            ],
            category: TestCategory.Earn,
            priority: TestPriority.High,
            stream: TestStream.Earn,
        },
        async () => {},
    );
});
