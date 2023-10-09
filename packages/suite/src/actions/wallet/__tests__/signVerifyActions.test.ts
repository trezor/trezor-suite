import { showAddress, sign, verify } from 'src/actions/wallet/signVerifyActions';

import { configureStore } from 'src/support/tests/configureStore';

const PATH = 'PATH';
const ADDRESS = 'ADDRESS';
const MESSAGE = 'MESSAGE';
const SIGNATURE = 'SIGNATURE';

jest.mock('@trezor/connect', () => {
    const getAddress = ({ address }: { address: string }) => ({
        success: true,
        payload: { address },
    });

    const signMessage = (_params: any) => ({
        success: true,
        payload: {
            address: ADDRESS,
            signature: SIGNATURE,
        },
    });

    const verifyMessage = ({
        address,
        message,
        signature,
    }: {
        address: string;
        message: string;
        signature: string;
    }) => ({
        success: address === ADDRESS && signature === SIGNATURE,
        payload: { message },
    });

    const originalModule = jest.requireActual('@trezor/connect');

    return {
        __esModule: true,
        ...originalModule,
        default: {
            getAddress,
            signMessage,
            verifyMessage,
        },
    };
});

const { getSuiteDevice } = global.JestMocks;

describe('Sign/Verify actions', () => {
    let store: any;

    beforeEach(() => {
        store = configureStore()({
            wallet: { selectedAccount: { account: { symbol: 'btc', networkType: 'bitcoin' } } },
            device: { selectedDevice: getSuiteDevice({ connected: true, available: true }) },
        });
    });

    it('showAddress', async () => {
        const res = await store.dispatch(showAddress(ADDRESS, PATH));
        expect(res).toStrictEqual({ address: ADDRESS });
    });

    it('sign', async () => {
        const res = await store.dispatch(sign(PATH, MESSAGE));
        expect(res).toStrictEqual(SIGNATURE);
    });

    it('verify', async () => {
        const res = await store.dispatch(verify(ADDRESS, MESSAGE, SIGNATURE));
        expect(res).toStrictEqual(true);
    });
});
