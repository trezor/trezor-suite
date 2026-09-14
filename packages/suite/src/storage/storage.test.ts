import { mockNetworkConfigDeps } from '@suite-common/networks/mocks';

import '@suite-common/test-utils/globalOverrides';

import { getSuiteDB } from './index';

const networkConfigDeps = mockNetworkConfigDeps();

describe('storage', () => {
    test('2 calls to uninitiated db', async () => {
        getSuiteDB(networkConfigDeps).addItem('coinjoinDebugSettings', {}, 'debug', true);
        await getSuiteDB(networkConfigDeps).addItem('coinjoinDebugSettings', {}, 'debug', true);

        // should not log anything after jest exits. there are no assertions here but for some reason
        // in jest 29 and node 18 on linux it seems to be exiting with code 1 should it try to log something
        // after this test is finished
    });
});
