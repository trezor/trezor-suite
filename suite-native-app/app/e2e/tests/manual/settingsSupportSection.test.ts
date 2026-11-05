import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Settings/Support section',
        {
            testCase: 'Settings/Support section',
            prerequisites: [],
            steps: [
                'On bottom bar click Settings gear icon and navigate to About Trezor section',
                'Check overall page design and text, click links in Follow us and Legal sections',
                'Navigate back to Settings and open Get help section, expand info via + button',
                'Click Contract support and verify Support page opens',
            ],
            category: TestCategory.Settings,
            priority: TestPriority.Low,
            stream: TestStream.Growth,
        },
        async () => {},
    );
});
