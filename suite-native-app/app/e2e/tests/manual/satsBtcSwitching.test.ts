import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Sats/BTC switching',
        {
            testCase: 'Sats/BTC switching',
            prerequisites: ['An app version with already imported btc XPUB'],
            steps: [
                'On bottom bar click Settings gear icon and navigate to Localisation',
                'Click Bitcoin Amount Units and change from Bitcoin to Satoshis',
                'Navigate to My assets and open a random bitcoin account',
                'Verify Bitcoin values are rendered in Satoshis',
            ],
            category: TestCategory.Settings,
            priority: TestPriority.High,
            stream: TestStream.Growth,
        },
        async () => {},
    );
});
