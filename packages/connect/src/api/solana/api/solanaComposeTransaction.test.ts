import { tokenProgramsInfo } from '@trezor/network-solana/constants';
import solana from '@trezor/network-solana/runtime';

import SolanaComposeTransaction from './solanaComposeTransaction';
import { assertBackendSupported, initBlockchain } from '../../../backend/BlockchainLink';
import { getCoinInfoOrThrow } from '../../../data/coinInfo';

jest.mock('@trezor/schema-utils', () => {
    const actual = jest.requireActual('@trezor/schema-utils');

    return {
        ...actual,
        Assert: jest.fn(),
    };
});

jest.mock('@trezor/network-solana/runtime', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('../../../backend/BlockchainLink', () => ({
    initBlockchain: jest.fn(),
    assertBackendSupported: jest.fn(),
}));

jest.mock('../../../data/coinInfo', () => ({
    getCoinInfoOrThrow: jest.fn(),
}));

const VALID_PAYLOAD = {
    method: 'solanaComposeTransaction',
    coin: 'sol',
    serializedTx: '00aa',
    toAddress: 'recipient-base-address',
    token: {
        mint: 'payload-token-mint',
        program: 'spl-token',
        decimals: 6,
        accounts: [
            {
                publicKey: 'source-token-account',
                balance: '1',
            },
        ],
    },
};

const createMethod = (payload: Record<string, unknown> = VALID_PAYLOAD) =>
    new SolanaComposeTransaction({ payload } as any);

describe('solanaComposeTransaction', () => {
    beforeEach(() => {
        jest.mocked(getCoinInfoOrThrow).mockReturnValue({ type: 'solana' } as any);
        jest.mocked(assertBackendSupported).mockImplementation(() => undefined);
        jest.mocked(initBlockchain).mockResolvedValue({} as any);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('uses verified token-account data when serializedTx can be decompiled', async () => {
        const instructions = [{ programAddress: 'token-program' }];
        const tokenAccountInfo = {
            baseAddress: 'recipient-base-address',
            tokenProgram: tokenProgramsInfo['spl-token'].publicKey,
            tokenMint: 'payload-token-mint',
            tokenAccount: 'matching-destination-account',
        };
        const getSolanaTokenAccountInfos = jest.fn().mockResolvedValue([tokenAccountInfo]);
        jest.mocked(solana).mockResolvedValue({
            getDecompiledMessage: jest.fn().mockReturnValue({
                message: { instructions },
            }),
            getSolanaTokenAccountInfos,
        } as any);

        expect(await createMethod().run({ sendCoreMessage: undefined } as any)).toEqual({
            serializedTx: VALID_PAYLOAD.serializedTx,
            additionalInfo: {
                tokenAccountInfo,
            },
        });
        expect(getSolanaTokenAccountInfos).toHaveBeenCalledWith({
            baseAddress: 'recipient-base-address',
            instructions,
            tokenMint: 'payload-token-mint',
        });
    });

    it('omits token metadata when no verified token account is found', async () => {
        jest.mocked(solana).mockResolvedValue({
            getDecompiledMessage: jest.fn().mockReturnValue({
                message: { instructions: [{ programAddress: 'memo-program' }] },
            }),
            getSolanaTokenAccountInfos: jest.fn().mockResolvedValue([]),
        } as any);

        expect(await createMethod().run({ sendCoreMessage: undefined } as any)).toEqual({
            serializedTx: VALID_PAYLOAD.serializedTx,
            additionalInfo: {},
        });
    });

    it('omits token metadata when decompilation throws', async () => {
        jest.mocked(solana).mockResolvedValue({
            getDecompiledMessage: jest.fn(() => {
                throw new Error('decode failed');
            }),
        } as any);

        expect(await createMethod().run({ sendCoreMessage: undefined } as any)).toEqual({
            serializedTx: VALID_PAYLOAD.serializedTx,
            additionalInfo: {},
        });
    });
});
