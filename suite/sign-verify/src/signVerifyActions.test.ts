import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { configureMockStore } from '@suite-common/test-utils';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import type { SignVerifyCapability } from '@trezor/network-module-suite-types';
import { ok } from '@trezor/type-utils';

import { showAddress, sign, verify } from './signVerifyActions';

const PATH = 'PATH';
const ADDRESS = 'ADDRESS';
const MESSAGE = 'MESSAGE';
const SIGNATURE = 'SIGNATURE';
const ACCOUNT = mockWalletAccount({ symbol: 'btc' });
const showAddressFn = jest.fn(() => Promise.resolve(ok({ address: ADDRESS })));
const signFn = jest.fn(() => Promise.resolve(ok({ address: ADDRESS, signature: SIGNATURE })));
const verifyFn = jest.fn(() => Promise.resolve(ok({ message: MESSAGE })));
const networkConfig: SignVerifyCapability = {
    getSignAddresses: () => [],
    showAddress: showAddressFn,
    sign: signFn,
    verify: verifyFn,
    formatSignedMessage: () => '',
};

describe('Sign/Verify action orchestration', () => {
    let store: any;

    beforeEach(() => {
        jest.clearAllMocks();
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
        const res = await store.dispatch(showAddress(networkConfig, ACCOUNT, ADDRESS, PATH));

        expect(res).toStrictEqual({ address: ADDRESS });
        expect(showAddressFn).toHaveBeenCalledWith(
            expect.objectContaining({ account: ACCOUNT, address: ADDRESS, path: PATH }),
        );
    });

    it('sign', async () => {
        const res = await store.dispatch(sign(networkConfig, ACCOUNT, PATH, MESSAGE));

        expect(res.address).toStrictEqual(ADDRESS);
        expect(res.signature).toStrictEqual(SIGNATURE);
        expect(signFn).toHaveBeenCalledWith(
            expect.objectContaining({ account: ACCOUNT, path: PATH, message: MESSAGE }),
        );
    });

    it('verify', async () => {
        const res = await store.dispatch(
            verify(networkConfig, ACCOUNT, ADDRESS, MESSAGE, SIGNATURE),
        );

        expect(res).toStrictEqual(true);
        expect(verifyFn).toHaveBeenCalledWith(
            expect.objectContaining({
                account: ACCOUNT,
                address: ADDRESS,
                message: MESSAGE,
                signature: SIGNATURE,
            }),
        );
    });
});
