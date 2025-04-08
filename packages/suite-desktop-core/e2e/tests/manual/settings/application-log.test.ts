import { createTestAnnotation } from '../../../support/annotations';
import { TestCategory, TestPriority, TestStream } from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';

test.describe.skip('Application log', { tag: ['@group=manual'] }, () => {
    test(
        'Application log modal in settings',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a user can open the application log modal in the Suite settings.',
                prerequisites: ['Seeded Trezor device', 'Connected Trezor Suite'],
                steps: [
                    'Navigate to "Settings"',
                    'Go to "Application settings"',
                    'Click on "Show log"',
                    'Application log modal should open',
                ],
                category: TestCategory.Settings,
                priority: TestPriority.Medium,
                stream: TestStream.Foundation,
            }),
        },
        async () => {},
    );
});
