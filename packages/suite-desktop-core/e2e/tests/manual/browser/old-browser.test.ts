import { TestAnnotation } from '../../../support/enums/testAnnotation';
import { test } from '../../../support/fixtures';
import { formatTestSteps } from '../../../support/stepsFormat';

test.describe.skip('Old browsers', { tag: ['@group=manual'] }, () => {
    test(
        "Check oldest supported browsers",
        {
            annotation: [
                {
                    type: TestAnnotation.TestCase,
                    description:
                        "Verifies that Suite is rendered properly in the oldest supported browsers.",
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
                        'Navigate to https://github.com/trezor/trezor-suite/blob/develop/packages/suite-build/browserslist to check min supported browsers.',
                        'Download min versions, you can find.',
                        'Open https://staging-suite.trezor.io/web/',
                        'Check that Suite is rendered properly /Dashboard,Accounts, Settings and Guide/.',
                        'Connect device and perform discovery.',
                    ]),
                },
            ],
        },
        async () => {},
    );
});
