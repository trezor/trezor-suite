import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Earn page', { tag: ['@group=manual'] }, () => {
    test(
        'Staking and yield tables',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that the Earn page lists available staking and yield opportunities.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite with stakeable networks enabled (e.g. ETH, SOL, ADA, TRX)',
                ],
                steps: [
                    'Navigate to the "Earn" page',
                    'Confirm the staking table lists supported assets (ETH, SOL, ADA, TRX)',
                    'Confirm the yield table lists supported yield opportunities',
                    'Confirm balances of eligible accounts are reflected in the tables',
                    'Click a staking row and confirm the app navigates to the staking flow/account',
                    'Click a yield row and confirm the app navigates to the yield flow',
                    'Confirm every staking/yield row displays an APY value',
                    'Open the APY detail/breakdown (hover or click the APY value)',
                    'Confirm the breakdown explains how the APY is composed (rewards, fees)',
                    'Confirm APY values are plausible (non-zero, within expected range for each asset)',
                ],
                category: TestCategory.Staking,
                priority: TestPriority.High,
                stream: TestStream.Wallet,
            }),
        },
        async () => {},
    );
});
