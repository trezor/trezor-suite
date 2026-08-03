import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { configureMockStore, testMocks } from '@suite-common/test-utils';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { showAddress, sign, verify } from './signVerifyActions';

const PATH = 'PATH';
const ADDRESS = 'ADDRESS';
const MESSAGE = 'MESSAGE';
const SIGNATURE = 'SIGNATURE';
const ACCOUNT = mockWalletAccount({ symbol: 'btc' });

describe('Sign/Verify actions', () => {
    let store: any;

    beforeEach(() => {
        store = configureMockStore({
            preloadedState: {
                wallet: {
                    settings: { addressDisplayType: 'chunked' },
                },
                device: { selectedDevice: mockSuiteDevice({ connected: true, available: true }) },
            },
        });
    });

    it('showAddress', async () => {
        testMocks.setTrezorConnectFixtures({
            success: true,
            payload: { address: ADDRESS },
        });
        const res = await store.dispatch(showAddress(ACCOUNT, ADDRESS, PATH));
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
        const res = await store.dispatch(sign(ACCOUNT, PATH, MESSAGE));
        expect(res.address).toStrictEqual(ADDRESS);
        expect(res.signature).toStrictEqual(SIGNATURE);
    });

    it('verify', async () => {
        testMocks.setTrezorConnectFixtures({
            success: true,
            payload: { message: MESSAGE },
        });
        const res = await store.dispatch(verify(ACCOUNT, ADDRESS, MESSAGE, SIGNATURE));
        expect(res).toStrictEqual(true);
    });
});
