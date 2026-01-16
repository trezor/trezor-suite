import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Basic dashboard check',
        {
            testCase: 'Basic dashboard check',
            prerequisites: ['an app with an account already imported'],
            steps: [
                'Click on various graph views (1D / 1W / 1M / 6M / 1Y / ALL) and verify graph re-adjusts',
                'Verify default time frame is one month',
                'Verify graph time frame is remembered',
                'Hold a finger on a point on the graph and verify displayed amount changes',
                'Verify imported assets are displayed under the graph',
                'Verify coin icons contain halo indicating % of portfolio of coin',
            ],
            category: TestCategory.Dashboard,
            priority: TestPriority.High,
            stream: TestStream.Growth,
        },
        async () => {},
    );
});
