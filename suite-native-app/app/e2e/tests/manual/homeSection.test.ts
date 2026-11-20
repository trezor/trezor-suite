import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Home section',
        {
            testCase: 'Home section',
            prerequisites: [
                'Already on-boarded application',
                'Device with transaction history is connected and discovery is finished',
            ],
            steps: [
                'Verify device name is present',
                'Verify My portfolio balance graph is loaded and rendered',
                'Click on timeline settings and verify graph changes accordingly',
                'Verify list of accounts in portfolio is present including accounts count',
                'Verify Home button in navigation is rendered as active',
            ],
            category: TestCategory.Dashboard,
            priority: TestPriority.Critical,
            stream: TestStream.Growth,
        },
        async () => {},
    );
});
