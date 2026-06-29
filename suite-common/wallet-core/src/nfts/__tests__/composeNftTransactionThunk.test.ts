import { composeNftTransactionThunk } from '../composeNftTransactionThunk';

jest.mock('@trezor/connect', () => ({
    __esModule: true,
    default: {
        blockchainEstimateFee: jest.fn(),
    },
}));

import TrezorConnect from '@trezor/connect';

const mockBlockchainEstimateFee = jest.mocked(TrezorConnect.blockchainEstimateFee);

const ACCOUNT = {
    symbol: 'eth',
    networkType: 'ethereum',
    descriptor: '0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3',
    availableBalance: '1000000000000000000',
    tokens: [
        {
            standard: 'ERC721' as const,
            contract: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
            symbol: 'BAYC',
            decimals: 0,
        },
    ],
} as any;

const FEE_INFO = {
    blockHeight: 1,
    blockTime: 12,
    minFee: 1,
    maxFee: 1000,
    minPriorityFee: 1,
    levels: [
        {
            label: 'normal',
            feePerUnit: '10000000000',
            feeLimit: '21000',
            blocks: 2,
        },
    ],
};

describe('composeNftTransactionThunk', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('uses NFT calldata for gas estimation', async () => {
        mockBlockchainEstimateFee.mockResolvedValue({
            success: true,
            payload: { levels: [{ feeLimit: '80000' }] },
        } as any);

        const dispatch = jest.fn(thunk => {
            if (typeof thunk === 'function') {
                return thunk(dispatch, () => ({}), undefined);
            }

            return Promise.resolve({ payload: {}, type: 'fulfilled' });
        });

        const thunk = composeNftTransactionThunk({
            account: ACCOUNT,
            feeInfo: FEE_INFO,
            tokenContract: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
            tokenId: '42',
            standard: 'ERC721',
            recipient: '0xB836472D21991eB9842e15BEaE1AF6c8B63D6a96',
            amount: 1,
        });

        await thunk(dispatch, () => ({}), undefined);

        expect(mockBlockchainEstimateFee).toHaveBeenCalledWith(
            expect.objectContaining({
                coin: 'eth',
                request: expect.objectContaining({
                    specific: expect.objectContaining({
                        to: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D', // contract address
                        value: '0x0',
                        data: expect.stringContaining('0x42842e0e'), // ERC721 safeTransferFrom selector
                    }),
                }),
            }),
        );
    });

    it('falls back to backup gas limit when estimation fails', async () => {
        mockBlockchainEstimateFee.mockResolvedValue({
            success: false,
            error: 'Network error',
        } as any);

        const dispatch = jest.fn(thunk => {
            if (typeof thunk === 'function') {
                return thunk(dispatch, () => ({}), undefined);
            }

            return Promise.resolve({ payload: {}, type: 'fulfilled' });
        });

        const thunk = composeNftTransactionThunk({
            account: ACCOUNT,
            feeInfo: FEE_INFO,
            tokenContract: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
            tokenId: '42',
            standard: 'ERC721',
            recipient: '0xB836472D21991eB9842e15BEaE1AF6c8B63D6a96',
            amount: 1,
        });

        const result = await thunk(dispatch, () => ({}), undefined);
        expect(result.type).toContain('fulfilled');
    });

    it('rejects when token is not found in account', async () => {
        const dispatch = jest.fn();

        const thunk = composeNftTransactionThunk({
            account: ACCOUNT,
            feeInfo: FEE_INFO,
            tokenContract: '0xDEAD',
            tokenId: '1',
            standard: 'ERC721',
            recipient: '0xB836472D21991eB9842e15BEaE1AF6c8B63D6a96',
            amount: 1,
        });

        const result = await thunk(dispatch, () => ({}), undefined);
        expect(result.type).toContain('rejected');
    });
});
