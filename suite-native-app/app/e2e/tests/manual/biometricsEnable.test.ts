import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Biometrics enable',
        {
            testCase: 'Biometrics enable',
            prerequisites: ['an app version with already imported btc XPUB'],
            steps: [
                'Navigate to Settings',
                'Select Privacy & Security',
                'Enable Biometrics',
                'Enter PIN, face or fingerprint that’s already registered in system',
                'Kill the app',
                'Start app',
                'Cancel biometric dialogue',
                'Enter correct biometrics',
                'Verify navigation to Lite app',
            ],
            category: TestCategory.Settings,
            priority: TestPriority.High,
            stream: TestStream.Growth,
        },
        async () => {},
    );
});
