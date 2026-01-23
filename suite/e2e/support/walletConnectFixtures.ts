import { test as baseTest } from './fixtures';
import { WalletConnectSignClient } from './walletConnectSignClient';

type WorkerFixtures = {
    wcSignClient: WalletConnectSignClient;
};

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
