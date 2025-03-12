import { TestAnnotation } from '../../../support/enums/testAnnotation';
import { test } from '../../../support/fixtures';
import { formatTestSteps } from '../../../support/stepsFormat';

test.describe.skip('Ethereum staking account', { tag: ['@group=manual'] }, () => {
    test(
        'Ethereum staking account',
        {
            annotation: [
                {
                    type: TestAnnotation.TestCase,
                    description:
                        'Verifies that a user can access the Ethereum staking account.',
                },
                { 
                    type: TestAnnotation.Prerequisites, 
                    description: formatTestSteps([
                        'Seeded Trezor device with transactions (eg. with "all" seed"',
                        'Connected Trezor Suite',
                        'Funded Ethereum account',
                    ]), 
                },
                {
                    type: TestAnnotation.Steps,
                    description: formatTestSteps([
                        'Open Ethereum account',
                        'Observe "Stake. Earn rewards. Repeat" card',
                        'Learn more button is clickable and opens to "Staking" tab',
                        '"X" button is clickable',
                    ]),
                },
            ],
        },
        async () => {},
    );
});
