import { createTestAnnotation } from '../../../support/annotations';
import { TestCategory, TestPriority, TestStream } from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';

test.describe.skip('Ethereum staking account', { tag: ['@group=manual'] }, () => {
    test(
        'Ethereum staking account',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can access the Ethereum staking account.',
                prerequisites: [
                    'Seeded Trezor device with transactions (eg. with "all" seed"',
                    'Connected Trezor Suite',
                    'Funded Ethereum account',
                ],
                steps: [
                    'Open Ethereum account',
                    'Observe "Stake. Earn rewards. Repeat" card',
                    'Learn more button is clickable and opens to "Staking" tab',
                    '"X" button is clickable',
                ],
                category: TestCategory.ETH,
                priority: TestPriority.Critical,
                stream: TestStream.Trends,
            }),
        },
        async () => {},
    );
});
