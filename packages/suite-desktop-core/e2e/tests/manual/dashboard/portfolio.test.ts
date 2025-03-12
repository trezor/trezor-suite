import { TestAnnotation } from '../../../support/enums/testAnnotation';
import { test } from '../../../support/fixtures';
import { formatTestSteps } from '../../../support/stepsFormat';

test.describe.skip('Portfolio', { tag: ['@group=manual'] }, () => {
    test(
        "Check portfolio",
        {
            annotation: [
                {
                    type: TestAnnotation.TestCase,
                    description:
                        "Verifies that the portfolio graph is rendered correctly.",
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
                        'Check the "Portfolio" graph',
                        'the graph is rendered correctly',
                        'Hover over any bottom part of the graph (eg "weekday" or a "month")',
                        'a popup with detail values shows',
                    ]),
                },
            ],
        },
        async () => {},
    );
});
