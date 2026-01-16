import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Arbitrum, Optimism and Base send form',
        {
            testCase: 'Arbitrum, Optimisim and Base send form',
            prerequisites: [],
            steps: ['No steps defined in source document'],
            category: TestCategory.Settings,
            priority: TestPriority.High,
            stream: TestStream.Wallet,
        },
        async () => {},
    );
});
