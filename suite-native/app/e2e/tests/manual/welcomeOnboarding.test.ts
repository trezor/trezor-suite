import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Welcome onboarding',
        {
            testCase: 'Welcome onboarding',
            prerequisites: ['Freshly installed app or wiped app storage'],
            steps: [
                'Start app and verify Welcome screen appears after splash',
                'Follow info screens and allow anonymous data collection for public builds',
                'Continue to Import XPUB or Coin enable section',
            ],
            category: TestCategory.Onboarding,
            priority: TestPriority.High,
            stream: TestStream.Growth,
        },
        async () => {},
    );
});
