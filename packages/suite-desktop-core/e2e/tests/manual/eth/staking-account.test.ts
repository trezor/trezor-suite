import { TestAnnotationType, TestCategory, TestPriority, TestStream } from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';
import { formatTestSteps } from '../../../support/stepsFormat';

test.describe.skip('Ethereum staking account', { tag: ['@group=manual'] }, () => {
    test(
        'Ethereum staking account',
        {
            annotation: [
                {
                    type: TestAnnotationType.TestCase,
                    description: 'Verifies that a user can access the Ethereum staking account.',
                },
                {
                    type: TestAnnotationType.Prerequisites,
                    description: formatTestSteps([
                        'Seeded Trezor device with transactions (eg. with "all" seed"',
                        'Connected Trezor Suite',
                        'Funded Ethereum account',
                    ]),
                },
                {
                    type: TestAnnotationType.Steps,
                    description: formatTestSteps([
                        'Open Ethereum account',
                        'Observe "Stake. Earn rewards. Repeat" card',
                        'Learn more button is clickable and opens to "Staking" tab',
                        '"X" button is clickable',
                    ]),
                },
                {
                    type: TestAnnotationType.Category,
                    description: TestCategory.ETH,
                },
                {
                    type: TestAnnotationType.Priority,
                    description: TestPriority.Critical,
                },
                {
                    type: TestAnnotationType.Stream,
                    description: TestStream.Trends,
                },
            ],
        },
        async () => {},
    );
});
