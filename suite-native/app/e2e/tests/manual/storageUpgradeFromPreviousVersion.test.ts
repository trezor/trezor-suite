import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Storage upgrade from previous version',
        {
            testCase: 'Storage upgrade from previous version',
            prerequisites: ['An app with an account already imported'],
            steps: [
                'Install previous public version and import at least two accounts',
                'Change at least two default settings and kill app',
                'Install new version and verify accounts and settings are intact',
            ],
            category: TestCategory.Accounts,
            priority: TestPriority.High,
            stream: TestStream.Foundation,
        },
        async () => {},
    );
});
