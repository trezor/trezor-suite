import { TestAnnotationType, TestCategory, TestPriority } from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';
import { formatTestSteps } from '../../../support/stepsFormat';

test.describe.skip('Portfolio', { tag: ['@group=manual'] }, () => {
    test(
        'Check portfolio',
        {
            annotation: [
                {
                    type: TestAnnotationType.TestCase,
                    description: 'Verifies that the portfolio graph is rendered correctly.',
                },
                {
                    type: TestAnnotationType.Prerequisites,
                    description: formatTestSteps([
                        'Seeded Trezor device',
                        'Connected Trezor Suite',
                    ]),
                },
                {
                    type: TestAnnotationType.Steps,
                    description: formatTestSteps([
                        'Check the "Portfolio" graph',
                        'The graph is rendered correctly',
                        'Hover over any bottom part of the graph (eg "weekday" or a "month")',
                        'A popup with detail values shows',
                    ]),
                },
                {
                    type: TestAnnotationType.Category,
                    description: TestCategory.Dashboard,
                },
                {
                    type: TestAnnotationType.Priority,
                    description: TestPriority.High,
                },
                {
                    type: TestAnnotationType.Stream,
                    description: 'TODO',
                },
            ],
        },
        async () => {},
    );
});
