import { TestCategory, TestPriority } from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Portfolio', { tag: ['@group=manual'] }, () => {
    test(
        'Check portfolio',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that the portfolio graph is rendered correctly.',
                prerequisites: ['Seeded Trezor device', 'Connected Trezor Suite'],
                steps: [
                    'Check the "Portfolio" graph',
                    'The graph is rendered correctly',
                    'Hover over any bottom part of the graph (eg "weekday" or a "month")',
                    'A popup with detail values shows',
                ],
                category: TestCategory.Dashboard,
                priority: TestPriority.High,
            }),
        },
        async () => {},
    );
});
