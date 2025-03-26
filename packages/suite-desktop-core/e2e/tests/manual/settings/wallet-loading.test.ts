import { TestAnnotation } from '../../../support/enums/testAnnotation';
import { test } from '../../../support/fixtures';
import { formatTestSteps } from '../../../support/stepsFormat';

test.describe.skip('Wallet loading', { tag: ['@group=manual'] }, () => {
    test(
        'Default wallet loading behavior',
        {
            annotation: [
                {
                    type: TestAnnotation.TestCase,
                    description:
                        'Verifies that a user can change the default wallet loading behavior in the Suite.',
                },
                {
                    type: TestAnnotation.Prerequisites,
                    description: formatTestSteps([
                        'Seeded Trezor device with transactions (eg. with "all" seed"',
                        'Connected Trezor Suite',
                    ]),
                },
                {
                    type: TestAnnotation.Steps,
                    description: formatTestSteps([
                        'Navigate to "Settings/Device"',
                        'In "Wallet loading" section switch default wallet loading',
                        'Reconnect device',
                        'Observe that wallet loading matches switch',
                    ]),
                },
            ],
        },
        async () => {},
    );
});
