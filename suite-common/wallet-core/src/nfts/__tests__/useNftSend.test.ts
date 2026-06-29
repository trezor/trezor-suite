jest.mock('@suite-common/device', () => ({
    selectSelectedDevice: jest.fn(),
}));

jest.mock('../../settings/walletSettingsReducer', () => ({
    selectAddressDisplayType: jest.fn(),
}));

jest.mock('../../send/sendFormEthereumThunks', () => ({
    ethereumGetCurrentNonceThunk: jest.fn(),
}));

jest.mock('../../send/sendFormThunks', () => ({
    synchronizeSentTransactionThunk: jest.fn(),
}));

jest.mock('@trezor/connect', () => ({
    __esModule: true,
    default: {
        ethereumSignTransaction: jest.fn(),
        pushTransaction: jest.fn(),
    },
}));

jest.mock('@suite-common/react-query', () => ({
    useMutation: jest.fn(opts => opts),
}));

jest.mock('react-redux', () => ({
    useDispatch: () => mockDispatch,
    useSelector: (selector: Function) => {
        const { selectSelectedDevice } = jest.requireMock('@suite-common/device');
        const { selectAddressDisplayType } = jest.requireMock('../../settings/walletSettingsReducer');
        if (selector === selectSelectedDevice) return DEVICE;
        if (selector === selectAddressDisplayType) return 'SINGLE';

        return undefined;
    },
}));

import TrezorConnect from '@trezor/connect';
import { ethereumGetCurrentNonceThunk } from '../../send/sendFormEthereumThunks';
import { useNftSend } from '../useNftSend';

const { useMutation } = jest.requireMock('@suite-common/react-query');
const mockUseMutation = jest.mocked(useMutation);
const mockSign = jest.mocked(TrezorConnect.ethereumSignTransaction);
const mockPush = jest.mocked(TrezorConnect.pushTransaction);
const mockGetNonce = jest.mocked(ethereumGetCurrentNonceThunk);

const DEVICE = {
    path: 'path',
    instance: 1,
    state: 'state',
    useEmptyPassphrase: false,
};

const mockDispatch = jest.fn();

const ACCOUNT = {
    symbol: 'eth',
    networkType: 'ethereum',
    descriptor: '0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3',
    availableBalance: '1000000000000000000',
    path: "m/44'/60'/0'/0/0",
    tokens: [],
} as any;

const TOKEN = {
    standard: 'ERC721' as const,
    contract: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
    symbol: 'BAYC',
    decimals: 0,
} as any;

describe('useNftSend', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetNonce.mockReturnValue({ unwrap: () => Promise.resolve({ nonce: '5' }) } as any);
        mockDispatch.mockImplementation(action => {
            if (action && typeof action.unwrap === 'function') return action;

            return Promise.resolve({ type: 'dispatched' });
        });
    });

    it('wires up useMutation correctly', () => {
        useNftSend({ account: ACCOUNT, token: TOKEN, tokenId: '42' });

        expect(mockUseMutation).toHaveBeenCalledWith(
            expect.objectContaining({ mutationFn: expect.any(Function) }),
        );
    });

    it('mutationFn signs and broadcasts the NFT transfer', async () => {
        mockSign.mockResolvedValue({
            success: true,
            payload: { serializedTx: '0xsignedtx' },
        } as any);
        mockPush.mockResolvedValue({
            success: true,
            payload: { txid: '0xdeadbeef' },
        } as any);
        mockDispatch.mockImplementation((action: any) => {
            // Simulate ethereumGetCurrentNonceThunk dispatch
            if (action && action.type === undefined) {
                return { unwrap: () => Promise.resolve({ nonce: '5' }) };
            }

            return Promise.resolve({ type: 'dispatched' });
        });

        useNftSend({ account: ACCOUNT, token: TOKEN, tokenId: '42' });

        const opts = mockUseMutation.mock.calls[0]?.[0] as { mutationFn: Function };
        const result = await opts.mutationFn({
            recipient: '0xB836472D21991eB9842e15BEaE1AF6c8B63D6a96',
            amount: 1,
            composedTransaction: {
                type: 'final',
                feeLimit: '80000',
                feePerByte: '10000000000',
                maxFeePerGas: undefined,
                maxPriorityFeePerGas: undefined,
            },
        });

        expect(mockSign).toHaveBeenCalledWith(
            expect.objectContaining({
                path: ACCOUNT.path,
                transaction: expect.objectContaining({
                    to: TOKEN.contract,
                    value: '0x00',
                    data: expect.stringContaining('0x42842e0e'),
                }),
            }),
        );
        expect(mockPush).toHaveBeenCalledWith(
            expect.objectContaining({ tx: '0xsignedtx', coin: 'eth' }),
        );
        expect(result).toEqual({ txid: '0xdeadbeef' });
    });

    it('throws when sign fails', async () => {
        mockSign.mockResolvedValue({ success: false, error: 'User rejected' } as any);
        mockDispatch.mockImplementation((action: any) => ({
            unwrap: () => Promise.resolve({ nonce: '3' }),
        }));

        useNftSend({ account: ACCOUNT, token: TOKEN, tokenId: '1' });

        const opts = mockUseMutation.mock.calls[0]?.[0] as { mutationFn: Function };
        await expect(
            opts.mutationFn({
                recipient: '0xB836472D21991eB9842e15BEaE1AF6c8B63D6a96',
                amount: 1,
                composedTransaction: { type: 'final', feeLimit: '80000', feePerByte: '10' },
            }),
        ).rejects.toThrow('User rejected');
    });
});
