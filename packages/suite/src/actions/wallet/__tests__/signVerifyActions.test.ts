import { testMocks } from '@suite-common/test-utils';
import { showAddress, sign, verify } from 'src/actions/wallet/signVerifyActions';

import { configureStore } from 'src/support/tests/configureStore';

const PATH = 'PATH';
const ADDRESS = 'ADDRESS';
const MESSAGE = 'MESSAGE';
const SIGNATURE = 'SIGNATURE';

const { getSuiteDevice } = testMocks;

describe('Sign/Verify actions', () => {
    let store: any;

    beforeEach(() => {
        store = configureStore()({
            wallet: { selectedAccount: { account: { symbol: 'btc', networkType: 'bitcoin' } } },
            device: { selectedDevice: getSuiteDevice({ connected: true, available: true }) },
            suite: { settings: { addressDisplayType: 'chunked' } },
        });
    });

    it('showAddress', async () => {
        testMocks.setTrezorConnectFixtures({
            success: true,
            payload: { address: ADDRESS },
        });
        const res = await store.dispatch(showAddress(ADDRESS, PATH));
        expect(res).toStrictEqual({ address: ADDRESS });
    });

    it('sign', async () => {
        testMocks.setTrezorConnectFixtures({
            success: true,
            payload: {
                address: ADDRESS,
                signature: SIGNATURE,
            },
        });
        const res = await store.dispatch(sign(PATH, MESSAGE));
        expect(res).toStrictEqual(SIGNATURE);
    });

    it('verify', async () => {
        testMocks.setTrezorConnectFixtures({
            success: true,
            payload: { message: MESSAGE },
        });
        const res = await store.dispatch(verify(ADDRESS, MESSAGE, SIGNATURE));
        expect(res).toStrictEqual(true);
    });
});
