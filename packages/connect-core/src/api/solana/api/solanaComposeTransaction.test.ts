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

const mockDecompiledInstructions = (instructions: unknown[]) =>
    jest.mocked(solana).mockResolvedValue({
        getDecompiledMessage: jest.fn().mockReturnValue({ instructions }),
    } as any);

const runMethod = (payload: Record<string, unknown> = VALID_PAYLOAD) =>
    new SolanaComposeTransaction({ payload } as any).run({ sendCoreMessage: undefined } as any);

describe('solanaComposeTransaction', () => {
    beforeEach(() => {
        jest.mocked(getCoinInfoOrThrow).mockReturnValue({ type: 'solana' } as any);
        jest.mocked(assertBackendSupported).mockImplementation(() => undefined);
        jest.mocked(initBlockchain).mockResolvedValue({} as any);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('uses transfer-checked instruction for token account info of a provided serializedTx', async () => {
        mockDecompiledInstructions([
            {
                type: 'transfer-checked',
                parsed: {
                    accounts: {
                        mint: { address: 'instruction-token-mint' },
                        destination: { address: 'instruction-destination-account' },
                    },
                },
            },
        ]);

        const result = await runMethod();

        expect(result).toEqual({
            serializedTx: VALID_PAYLOAD.serializedTx,
            additionalInfo: {
                tokenAccountInfo: {
                    baseAddress: 'recipient-base-address',
                    tokenProgram: tokenProgramsInfo['spl-token'].publicKey,
                    tokenMint: 'instruction-token-mint',
                    tokenAccount: 'instruction-destination-account',
                },
            },
        });
        expect(result.additionalInfo).not.toHaveProperty('newAccountProgramName');
    });

    it('omits token account info when the provided serializedTx has no transfer-checked instruction', async () => {
        mockDecompiledInstructions([{ type: 'transfer-sol' }]);

        expect((await runMethod()).additionalInfo).toEqual({ tokenAccountInfo: undefined });
    });

    it('omits token account info when the provided serializedTx cannot be decompiled', async () => {
        jest.mocked(solana).mockResolvedValue({
            getDecompiledMessage: jest.fn(() => {
                throw new Error('decode failed');
            }),
        } as any);

        expect((await runMethod()).additionalInfo).toEqual({ tokenAccountInfo: undefined });
    });

    it('returns a provided native serializedTx as is without decompiling it', async () => {
        expect(await runMethod({ ...VALID_PAYLOAD, token: undefined })).toEqual({
            serializedTx: VALID_PAYLOAD.serializedTx,
            additionalInfo: { tokenAccountInfo: undefined },
        });
        expect(solana).not.toHaveBeenCalled();
    });
});
