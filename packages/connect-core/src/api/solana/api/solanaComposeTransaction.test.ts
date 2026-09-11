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
        mint: 'fallback-token-mint',
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

    it('uses transfer-checked instruction data when serializedTx can be decompiled', async () => {
        jest.mocked(solana).mockResolvedValue({
            getDecompiledMessage: jest.fn().mockReturnValue({
                instructions: [
                    {
                        type: 'transfer-checked',
                        parsed: {
                            accounts: {
                                mint: { address: 'instruction-token-mint' },
                                destination: { address: 'instruction-destination-account' },
                            },
                        },
                    },
                ],
            }),
        } as any);

        expect(await createMethod().run({ sendCoreMessage: undefined } as any)).toEqual({
            serializedTx: VALID_PAYLOAD.serializedTx,
            additionalInfo: {
                newAccountProgramName: 'spl-token',
                tokenAccountInfo: {
                    baseAddress: 'recipient-base-address',
                    tokenProgram: tokenProgramsInfo['spl-token'].publicKey,
                    tokenMint: 'instruction-token-mint',
                    tokenAccount: 'instruction-destination-account',
                },
            },
        });
    });

    it('falls back to payload token data when transfer-checked instruction is missing', async () => {
        jest.mocked(solana).mockResolvedValue({
            getDecompiledMessage: jest.fn().mockReturnValue({
                instructions: [{ type: 'memo' }],
            }),
        } as any);

        expect(await createMethod().run({ sendCoreMessage: undefined } as any)).toEqual({
            serializedTx: VALID_PAYLOAD.serializedTx,
            additionalInfo: {
                newAccountProgramName: 'spl-token',
                tokenAccountInfo: {
                    baseAddress: 'recipient-base-address',
                    tokenProgram: tokenProgramsInfo['spl-token'].publicKey,
                    tokenMint: 'fallback-token-mint',
                    tokenAccount: 'recipient-base-address',
                },
            },
        });
    });

    it('falls back to payload token data when decompilation throws', async () => {
        jest.mocked(solana).mockResolvedValue({
            getDecompiledMessage: jest.fn(() => {
                throw new Error('decode failed');
            }),
        } as any);

        expect(await createMethod().run({ sendCoreMessage: undefined } as any)).toEqual({
            serializedTx: VALID_PAYLOAD.serializedTx,
            additionalInfo: {
                newAccountProgramName: 'spl-token',
                tokenAccountInfo: {
                    baseAddress: 'recipient-base-address',
                    tokenProgram: tokenProgramsInfo['spl-token'].publicKey,
                    tokenMint: 'fallback-token-mint',
                    tokenAccount: 'recipient-base-address',
                },
            },
        });
    });
});
