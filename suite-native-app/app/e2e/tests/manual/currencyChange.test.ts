import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

// Template-based test (unchanged); original had describe.skip
describe.skip('Settings', () => {
    it(
        'Change currency',
        {
            testCase: 'Currency change',
            prerequisites: ['an app with an Bitcoin account already imported'],
            steps: [
                'On bottom bar click on Settings gear icon',
                'Click on Localization',
                'Change fiat currency',
                'Navigate to Home section and verify prices of imported accounts changed accordingly',
            ],
            category: TestCategory.Settings,
            priority: TestPriority.Medium,
            stream: TestStream.Growth,
        },
        async () => {},
    );
});
