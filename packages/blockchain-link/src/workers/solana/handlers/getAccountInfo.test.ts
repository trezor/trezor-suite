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
const sender = '8omRgd6HBSSsJs81tbjag3igM2CF444m6DpuvMsCBDCx';
const senderTokenAccount = 'BRgrqMggCS1ZU8Yxmh1rVMDyqhiiq74rJN4yu9mgqUZ4';

const token2022Program = tokenProgramsInfo['spl-token-2022'].publicKey;

type TokenBalance = {
    accountIndex: number;
    owner: string;
    amount: string;
};

type CreateTransactionParams = {
    signature: string;
    // The first key is the fee payer.
    accountKeys: string[];
    instructions: unknown[];
    tokenBalances: { pre: TokenBalance[]; post: TokenBalance[] };
};

const createTransaction = ({
    signature,
    accountKeys,
    instructions,
    tokenBalances,
}: CreateTransactionParams) => {
    const toTokenBalance = ({ accountIndex, owner, amount }: TokenBalance) => ({
        accountIndex,
        mint,
        owner,
        programId: token2022Program,
        uiTokenAmount: { amount, decimals: 6 },
    });

    return {
        slot: 2n,
        blockTime: 1790000000n,
        transaction: {
            signatures: [signature],
            message: {
                accountKeys: accountKeys.map((pubkey, index) => ({
                    pubkey,
                    signer: index === 0,
                    writable: true,
                    source: 'transaction',
                })),
                recentBlockhash: 'recentBlockhash',
                instructions,
            },
        },
        meta: {
            err: null,
            fee: 5000n,
            preBalances: accountKeys.map(() => 1000000n),
            postBalances: accountKeys.map(() => 1000000n),
            innerInstructions: [],
            preTokenBalances: tokenBalances.pre.map(toTokenBalance),
            postTokenBalances: tokenBalances.post.map(toTokenBalance),
        },
    };
};

type Transaction = ReturnType<typeof createTransaction>;

// A token issuer mints into the user's token account, so there is no transfer instruction to parse.
const mintToTransaction = createTransaction({
    signature: 'mintToSignature',
    accountKeys: [issuer, tokenAccount, mint, token2022Program],
    instructions: [
        {
            program: 'spl-token',
            programId: token2022Program,
            parsed: {
                type: 'mintTo',
                info: { account: tokenAccount, amount: '100000000', mint, mintAuthority: issuer },
            },
        },
    ],
    tokenBalances: {
        pre: [],
        post: [{ accountIndex: 1, owner: descriptor, amount: '100000000' }],
    },
});

// Token-2022 mints with the transfer fee extension (e.g. PYUSD) are often sent with transferCheckedWithFee.
const transferCheckedWithFeeTransaction = createTransaction({
    signature: 'transferCheckedWithFeeSignature',
    accountKeys: [sender, tokenAccount, senderTokenAccount, mint, token2022Program],
    instructions: [
        {
            program: 'spl-token',
            programId: token2022Program,
            parsed: {
                type: 'transferCheckedWithFee',
                info: {
                    authority: sender,
                    destination: tokenAccount,
                    feeAmount: { amount: '0', decimals: 6 },
                    mint,
                    source: senderTokenAccount,
                    tokenAmount: { amount: '100000000', decimals: 6 },
                },
            },
        },
    ],
    tokenBalances: {
        pre: [{ accountIndex: 2, owner: sender, amount: '500000000' }],
        post: [
            { accountIndex: 1, owner: descriptor, amount: '100000000' },
            { accountIndex: 2, owner: sender, amount: '400000000' },
        ],
    },
});

type EpochInfo = { epoch: bigint; slotIndex: bigint; slotsInEpoch: bigint };

const SLOTS_IN_EPOCH = 432000n;

const midEpochInfo: EpochInfo = { epoch: 7n, slotIndex: 1000n, slotsInEpoch: SLOTS_IN_EPOCH };

type CreateApiMockParams = {
    transaction: Transaction;
    getEpochInfo?: () => Promise<EpochInfo>;
};

const createApiMock = ({
    transaction,
    getEpochInfo = () => Promise.resolve(midEpochInfo),
}: CreateApiMockParams) =>
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
                send: () =>
                    Promise.resolve([
                        {
                            signature: transaction.transaction.signatures[0],
                            slot: transaction.slot,
                        },
                    ]),
            }),
            getTransaction: () => ({ send: () => Promise.resolve(transaction) }),
            getBalance: () => ({ send: () => Promise.resolve({ value: 995000n }) }),
            getEpochInfo: () => ({ send: getEpochInfo }),
            getProgramAccounts: () => ({ send: () => Promise.resolve([]) }),
            getMinimumBalanceForRentExemption: () => ({ send: () => Promise.resolve(890880n) }),
        },
    }) as unknown as SolanaAPI;

type CreateRequestParams = CreateApiMockParams & {
    state?: WorkerState;
};

const createRequest = ({
    state = new WorkerState(),
    ...apiMockParams
}: CreateRequestParams): Request<MessageTypes.GetAccountInfo> => ({
    type: MESSAGES.GET_ACCOUNT_INFO,
    payload: { descriptor, details: 'txs' },
    connect: () => Promise.resolve(createApiMock(apiMockParams)),
    post: () => {},
    state,
    getTokenMetadata: () => Promise.resolve({ [mint]: { name: 'Token', symbol: 'TKN' } }),
    onSubscriptionsClosed: () => {},
});

describe('solana getAccountInfo', () => {
    it('loads the account when a token transfer is derived from a balance change', async () => {
        const response = await getAccountInfo(createRequest({ transaction: mintToTransaction }));

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

    it('resolves the sender of a transferCheckedWithFee transfer', async () => {
        const response = await getAccountInfo(
            createRequest({ transaction: transferCheckedWithFeeTransaction }),
        );

        expect(response.payload.history.transactions?.[0]?.tokens).toEqual([
            expect.objectContaining({
                type: 'recv',
                from: sender,
                to: descriptor,
                contract: mint,
                amount: '100000000',
            }),
        ]);
    });

    describe('epoch cache', () => {
        const startTime = 1_790_000_000_000;
        const minuteMs = 60 * 1000;
        // Stake accounts deactivated in a new epoch read as active under the previous one.
        // 9 000 slots take 30 minutes at the 200 ms mainnet slot time.
        const slotsLeftInEpoch = 9_000n;
        const lastSlotsEpochInfo: EpochInfo = {
            epoch: 7n,
            slotIndex: SLOTS_IN_EPOCH - slotsLeftInEpoch,
            slotsInEpoch: SLOTS_IN_EPOCH,
        };
        const nextEpochInfo: EpochInfo = { epoch: 8n, slotIndex: 0n, slotsInEpoch: SLOTS_IN_EPOCH };

        let now = startTime;

        beforeEach(() => {
            now = startTime;
            jest.spyOn(Date, 'now').mockImplementation(() => now);
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        const getSolEpochTwice = async (secondCallDelayMs: number) => {
            const state = new WorkerState();
            const getEpochInfo = jest
                .fn<Promise<EpochInfo>, []>()
                .mockResolvedValueOnce(lastSlotsEpochInfo)
                .mockResolvedValueOnce(nextEpochInfo);

            const first = await getAccountInfo(
                createRequest({ transaction: mintToTransaction, state, getEpochInfo }),
            );
            now += secondCallDelayMs;
            const second = await getAccountInfo(
                createRequest({ transaction: mintToTransaction, state, getEpochInfo }),
            );

            return {
                solEpochs: [first.payload.misc?.solEpoch, second.payload.misc?.solEpoch],
                epochInfoCalls: getEpochInfo.mock.calls.length,
            };
        };

        it('refetches the epoch once it has ended at the 200 ms slot time', async () => {
            const { solEpochs, epochInfoCalls } = await getSolEpochTwice(35 * minuteMs);

            expect(solEpochs).toEqual([7, 8]);
            expect(epochInfoCalls).toBe(2);
        });

        it('reuses the cached epoch while it lasts', async () => {
            const { solEpochs, epochInfoCalls } = await getSolEpochTwice(10 * minuteMs);

            expect(solEpochs).toEqual([7, 7]);
            expect(epochInfoCalls).toBe(1);
        });

        it.each([
            { slotsLeft: 1n, rpcDelayMs: 0 },
            { slotsLeft: 2n, rpcDelayMs: 200 },
        ])(
            'refetches immediately with $slotsLeft slots left and a $rpcDelayMs ms response',
            async ({ slotsLeft, rpcDelayMs }) => {
                const state = new WorkerState();
                const getEpochInfo = jest
                    .fn<Promise<EpochInfo>, []>()
                    .mockImplementationOnce(() => {
                        now += rpcDelayMs;

                        return Promise.resolve({
                            ...lastSlotsEpochInfo,
                            slotIndex: SLOTS_IN_EPOCH - slotsLeft,
                        });
                    })
                    .mockResolvedValueOnce(nextEpochInfo);
                const request = createRequest({
                    transaction: mintToTransaction,
                    state,
                    getEpochInfo,
                });

                expect((await getAccountInfo(request)).payload.misc?.solEpoch).toBe(7);
                expect((await getAccountInfo(request)).payload.misc?.solEpoch).toBe(8);
            },
        );

        it('does not keep a failed epoch request in the cache', async () => {
            const state = new WorkerState();
            const getEpochInfo = jest
                .fn<Promise<EpochInfo>, []>()
                .mockRejectedValueOnce(new Error('RPC unavailable'))
                .mockResolvedValueOnce(midEpochInfo);

            await expect(
                getAccountInfo(
                    createRequest({ transaction: mintToTransaction, state, getEpochInfo }),
                ),
            ).rejects.toThrow('RPC unavailable');

            const response = await getAccountInfo(
                createRequest({ transaction: mintToTransaction, state, getEpochInfo }),
            );

            expect(response.payload.misc?.solEpoch).toBe(7);
        });
    });
});
