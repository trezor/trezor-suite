import { TestAnnotation } from '../../../support/enums/testAnnotation';
import { test } from '../../../support/fixtures';
import { formatTestSteps } from '../../../support/stepsFormat';

test.describe.skip('Application log', { tag: ['@group=manual'] }, () => {
    test(
        'Application log modal in settings',
        {
            annotation: [
                {
                    type: TestAnnotation.TestCase,
                    description:
                        'Verifies that a user can open the application log modal in the Suite settings.',
                },
                { 
                    type: TestAnnotation.Prerequisites, 
                    description: formatTestSteps([
                        'Seeded Trezor device',
                        'Connected Trezor Suite',
                    ]), 
                },
                {
                    type: TestAnnotation.Steps,
                    description: formatTestSteps([
                        'Navigate to "Settings"',
                        'Go to "Application settings"',
                        'Click on "Show log"',
                        'Application log modal should open',
                    ]),
                },
            ],
        },
        async () => {},
    );
});
