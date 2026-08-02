import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { configureMockStore, testMocks } from '@suite-common/test-utils';
import { ACCOUNT_AUTHORIZATION_UNAVAILABLE_MESSAGE } from '@suite-common/wallet-utils';

import { showAddress, sign, verify } from 'src/actions/wallet/signVerifyActions';

const PATH = 'PATH';
const ADDRESS = 'ADDRESS';
const MESSAGE = 'MESSAGE';
const SIGNATURE = 'SIGNATURE';

describe('Sign/Verify actions', () => {
    let store: any;

    beforeEach(() => {
        store = configureMockStore({
            preloadedState: {
                wallet: {
                    selectedAccount: { account: { symbol: 'btc', networkType: 'bitcoin' } },
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
        expect(res.address).toStrictEqual(ADDRESS);
        expect(res.signature).toStrictEqual(SIGNATURE);
    });

    it('allows a watch-only account to verify but stops it at signing', async () => {
        store = configureMockStore({
            preloadedState: {
                wallet: {
                    selectedAccount: {
                        account: { symbol: 'btc', networkType: 'bitcoin', isWatchOnly: true },
                    },
                    settings: { addressDisplayType: 'chunked' },
                },
                device: { selectedDevice: mockSuiteDevice({ connected: true, available: true }) },
            },
        });

        const result = await store.dispatch(sign(PATH, MESSAGE));
        const notificationAction = store
            .getActions()
            .find(
                ({ payload }: { payload?: { type?: string } }) =>
                    payload?.type === 'sign-message-error',
            );

        expect(result).toBe(false);
        expect(notificationAction.payload.error).toBe(ACCOUNT_AUTHORIZATION_UNAVAILABLE_MESSAGE);

        testMocks.setTrezorConnectFixtures({
            success: true,
            payload: { message: MESSAGE },
        });

        await expect(store.dispatch(verify(ADDRESS, MESSAGE, SIGNATURE))).resolves.toBe(true);
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
