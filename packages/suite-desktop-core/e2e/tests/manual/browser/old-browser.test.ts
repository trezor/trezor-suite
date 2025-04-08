import { formatTestSteps } from '../../../support/annotations';
import {
    TestAnnotationType,
    TestCategory,
    TestPriority,
} from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';

test.describe.skip('Old browsers', { tag: ['@group=manual'] }, () => {
    test(
        'Check oldest supported browsers',
        {
            annotation: [
                {
                    type: TestAnnotationType.TestCase,
                    description:
                        'Verifies that Suite is rendered properly in the oldest supported browsers.',
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
                        'Navigate to https://github.com/trezor/trezor-suite/blob/develop/packages/suite-build/browserslist to check min supported browsers.',
                        'Download min versions, you can find.',
                        'Open https://staging-suite.trezor.io/web/',
                        'Check that Suite is rendered properly /Dashboard,Accounts, Settings and Guide/.',
                        'Connect device and perform discovery.',
                    ]),
                },
                {
                    type: TestAnnotationType.Category,
                    description: TestCategory.Wallets,
                },
                {
                    type: TestAnnotationType.Priority,
                    description: TestPriority.Medium,
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
