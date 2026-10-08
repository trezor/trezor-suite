import { MESSAGES, type MessageTypes, RESPONSES } from '@trezor/blockchain-link-types';
import { tokenProgramsInfo } from '@trezor/network-solana/constants';
import type { SolanaAPI } from '@trezor/network-solana/types';

import { getAccountInfo } from './getAccountInfo';
import { WorkerState } from '../../state';
import type { Request } from '../types';

const descriptor = 'DDBF6Yfa2iSt7v5VwQqpoqrCso2uBcmsTKPQu9vZZzeg';
const tokenAccount = '3cEFnhs2mZBMEhENGh6eor1VG3mMP4Tf32bdaCbdyN9q';
const mint = 'CXGiC9EhaGfpj4Ajc8WAU3UVpWxnyzdL7bCJUaUy2UHQ';
const issuer = '8zCfx6n1MaH7hQ6q1eafD2nZ9Cn1CwKU83SaaG5mfSLC';

const token2022Program = tokenProgramsInfo['spl-token-2022'].publicKey;

// A token issuer mints into the user's token account, so there is no transfer instruction to parse.
const mintToTransaction = {
    slot: 2n,
    blockTime: 1790000000n,
    transaction: {
        signatures: ['mintToSignature'],
        message: {
            accountKeys: [
                { pubkey: issuer, signer: true, writable: true, source: 'transaction' },
                { pubkey: tokenAccount, signer: false, writable: true, source: 'transaction' },
                { pubkey: mint, signer: false, writable: true, source: 'transaction' },
                { pubkey: token2022Program, signer: false, writable: false, source: 'transaction' },
            ],
            recentBlockhash: 'recentBlockhash',
            instructions: [
                {
                    program: 'spl-token',
                    programId: token2022Program,
                    parsed: {
                        type: 'mintTo',
                        info: {
                            account: tokenAccount,
                            amount: '100000000',
                            mint,
                            mintAuthority: issuer,
                        },
                    },
                    stackHeight: 1,
                },
            ],
        },
    },
    meta: {
        err: null,
        fee: 5000n,
        preBalances: [1000000n, 2039280n, 1461600n, 1n],
        postBalances: [995000n, 2039280n, 1461600n, 1n],
        innerInstructions: [],
        preTokenBalances: [],
        postTokenBalances: [
            {
                accountIndex: 1,
                mint,
                owner: descriptor,
                programId: token2022Program,
                uiTokenAmount: { amount: '100000000', decimals: 6 },
            },
        ],
    },
};

const createApiMock = (transaction: unknown) =>
    ({
        rpc: {
            getAccountInfo: (_address: string, { encoding }: { encoding: string }) => ({
                // The base64 lookup reads the account itself, jsonParsed resolves a token account owner.
                send: () =>
                    Promise.resolve({
                        value:
                            encoding === 'base64'
                                ? { lamports: 1000000n, data: ['', 'base64'], owner: issuer }
                                : null,
                    }),
            }),
            getTokenAccountsByOwner: (_owner: string, filter: { programId: string }) => ({
                send: () =>
                    Promise.resolve({
                        value:
                            filter.programId === token2022Program
                                ? [
                                      {
                                          pubkey: tokenAccount,
                                          account: {
                                              data: {
                                                  program: 'spl-token-2022',
                                                  parsed: {
                                                      type: 'account',
                                                      info: {
                                                          mint,
                                                          tokenAmount: {
                                                              amount: '100000000',
                                                              decimals: 6,
                                                          },
                                                      },
                                                  },
                                              },
                                          },
                                      },
                                  ]
                                : [],
                    }),
            }),
            getMultipleAccounts: (addresses: string[]) => ({
                send: () =>
                    Promise.resolve({
                        value: addresses.map(() => ({ lamports: 1n, data: ['', 'base64'] })),
                    }),
            }),
            getSignaturesForAddress: () => ({
                send: () => Promise.resolve([{ signature: 'mintToSignature', slot: 2n }]),
            }),
            getTransaction: () => ({ send: () => Promise.resolve(transaction) }),
            getBalance: () => ({ send: () => Promise.resolve({ value: 995000n }) }),
            getEpochInfo: () => ({ send: () => Promise.resolve({ epoch: 7n }) }),
            getProgramAccounts: () => ({ send: () => Promise.resolve([]) }),
            getMinimumBalanceForRentExemption: () => ({ send: () => Promise.resolve(890880n) }),
        },
    }) as unknown as SolanaAPI;

const createRequest = (transaction: unknown): Request<MessageTypes.GetAccountInfo> => ({
    type: MESSAGES.GET_ACCOUNT_INFO,
    payload: { descriptor, details: 'txs' },
    connect: () => Promise.resolve(createApiMock(transaction)),
    post: () => {},
    state: new WorkerState(),
    getTokenMetadata: () => Promise.resolve({ [mint]: { name: 'Token', symbol: 'TKN' } }),
    onSubscriptionsClosed: () => {},
});

describe('solana getAccountInfo', () => {
    it('loads the account when a token transfer is derived from a balance change', async () => {
        const response = await getAccountInfo(createRequest(mintToTransaction));

        expect(response.type).toBe(RESPONSES.GET_ACCOUNT_INFO);
        expect(response.payload.history.transactions?.[0]?.tokens).toEqual([
            expect.objectContaining({
                type: 'recv',
                from: '',
                to: descriptor,
                contract: mint,
                amount: '100000000',
            }),
        ]);
    });
});
