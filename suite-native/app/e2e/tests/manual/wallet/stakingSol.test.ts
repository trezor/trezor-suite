import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'SOL staking full flow - claim, stake, unstake',
        {
            testCase: 'The whole Solana staking lifecycle works: claim, stake and unstake',
            prerequisites: [
                'connected device',
                'seed with SOL funds on it, with an existing stake and deactivated (claimable) funds',
                'can be performed on the Solana devnet',
            ],
            steps: [
                'Navigate to the Earn screen and open the SOL staking overview',
                'Start the claim flow, review the transaction data and sign it on the device',
                'Verify the claimed funds are returned to the available balance',
                'Start the staking flow',
                'For first-time staking, verify the consent/acknowledge screen and confirm it',
                'Fill in the amount to stake, verify crypto/fiat values and the fee',
                'Review the transaction data, sign it on the device and verify the confirmation screen',
                'Verify the staking transaction appears and the staked balance updates',
                'Open the staking management and start the unstake flow',
                'Fill in the amount, review and sign the unstake transaction on the device',
                'Verify the stake enters the deactivation period',
            ],
            category: TestCategory.Staking,
            priority: TestPriority.Critical,
            stream: TestStream.Earn,
        },
        async () => {},
    );
});
