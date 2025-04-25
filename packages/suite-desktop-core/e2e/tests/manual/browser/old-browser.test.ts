import { TestCategory, TestPriority } from '../../../support/enums/testAnnotations';
import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Old browsers', { tag: ['@group=manual'] }, () => {
    test(
        'Check oldest supported browsers',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that Suite is rendered properly in the oldest supported browsers.',
                prerequisites: ['Seeded Trezor device', 'Connected Trezor Suite'],
                steps: [
                    'Navigate to https://github.com/trezor/trezor-suite/blob/develop/packages/suite-build/browserslist to check min supported browsers.',
                    'Download min versions, you can find.',
                    'Open https://staging-suite.trezor.io/web/',
                    'Check that Suite is rendered properly /Dashboard,Accounts, Settings and Guide/.',
                    'Connect device and perform discovery.',
                ],
                category: TestCategory.Wallets,
                priority: TestPriority.Medium,
            }),
        },
        async () => {},
    );
});
