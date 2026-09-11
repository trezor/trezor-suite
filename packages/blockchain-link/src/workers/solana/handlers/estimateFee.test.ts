import { type MessageTypes } from '@trezor/blockchain-link-types';
import solana from '@trezor/network-solana/runtime';

import { estimateFee } from './estimateFee';
import { type Request } from '../types';

jest.mock('@trezor/network-solana/runtime', () => ({
    __esModule: true,
    default: jest.fn(),
}));

describe('Solana estimateFee', () => {
    it('returns token-account mappings resolved from the decompiled transaction', async () => {
        const instructions = [{ programAddress: 'token-program' }];
        const solanaTokenAccountInfos = [
            {
                baseAddress: 'recipient',
                tokenAccount: 'token-account',
                tokenMint: 'token-mint',
                tokenProgram: 'token-program',
            },
        ];
        const getSolanaTokenAccountInfos = jest.fn(() => solanaTokenAccountInfos);
        jest.mocked(solana).mockResolvedValue({
            getFees: jest.fn().mockResolvedValue({
                accountCreationFee: BigInt(100),
                baseFee: BigInt(5000),
                decompiledTransactionMessage: {
                    feePayer: { address: 'fee-payer' },
                    instructions,
                },
                priorityFee: {
                    computeUnitLimit: '200000',
                    computeUnitPrice: '300000',
                    fee: '60000',
                },
            }),
            getSolanaTokenAccountInfos,
        } as unknown as Awaited<ReturnType<typeof solana>>);
        const request = {
            connect: jest.fn().mockResolvedValue({}),
            payload: {
                specific: {
                    data: 'serialized-transaction',
                    solanaToken: {
                        baseAddress: 'recipient',
                        mint: 'token-mint',
                    },
                },
            },
        } as unknown as Request<MessageTypes.EstimateFee>;

        const result = await estimateFee(request);

        expect(getSolanaTokenAccountInfos).toHaveBeenCalledWith({
            baseAddress: 'recipient',
            instructions,
            tokenMint: 'token-mint',
        });
        expect(result.payload[0]?.solanaTokenAccountInfos).toEqual(solanaTokenAccountInfos);
    });
});
