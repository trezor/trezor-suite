import { test as baseTest } from './fixtures';
import { WalletConnectSignClient } from './walletConnectSignClient';

type WorkerFixtures = {
    wcSignClient: WalletConnectSignClient;
};

// Playwright's test.extend<TestArgs, WorkerArgs> propagates TestArgs into
// each fixture's destructured first parameter. Replacing `{}` with
// `Record<string, never>` makes that destructured arg `never`, which then
// rejects the real fixture return type (WalletConnectSignClient).
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export const test = baseTest.extend<{}, WorkerFixtures>({
    wcSignClient: [
        async ({}, use) => {
            const wcSignClient = new WalletConnectSignClient();

            await wcSignClient.init();
            await use(wcSignClient);
            await wcSignClient.disconnect();
        },
        { scope: 'worker' },
    ],
});

export { expect } from './fixtures';
