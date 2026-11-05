import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Color scheme',
        {
            testCase: 'Color scheme',
            prerequisites: [],
            steps: [
                'On bottom bar click on Settings gear icon',
                'Click on Customization',
                'Change Color scheme and verify app colors update accordingly',
            ],
            category: TestCategory.Settings,
            priority: TestPriority.Medium,
            stream: TestStream.Growth,
        },
        async () => {},
    );
});
