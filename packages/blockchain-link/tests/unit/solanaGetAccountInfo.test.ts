import { MESSAGES, RESPONSES } from '@trezor/blockchain-link-types';
import type { Response } from '@trezor/blockchain-link-types';
import { TOKEN_PROGRAM_PUBLIC_KEY } from '@trezor/coins-solana/constants';
import type { SolanaAPI } from '@trezor/coins-solana/types';

import SolanaWorker, { TOKEN_ACCOUNTS_SCAN_LIMIT } from '../../src/workers/solana';

const RECOGNIZED_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

jest.mock('@trezor/blockchain-link-utils', () => {
    const actual = jest.requireActual('@trezor/blockchain-link-utils');

    return {
        ...actual,
        solanaUtils: {
            ...actual.solanaUtils,
            getTokenMetadata: () =>
                Promise.resolve({
                    EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: {
                        name: 'USD Coin',
                        symbol: 'USDC',
                    },
                }),
        },
    };
});

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

const encodeBase58 = (bytes: Uint8Array) => {
    let value = bytes.reduce((acc, byte) => acc * 256n + BigInt(byte), 0n);

    let encoded = '';
    while (value > 0n) {
        encoded = BASE58_ALPHABET[Number(value % 58n)] + encoded;
        value /= 58n;
    }

    return encoded;
};

// Produces a deterministic, valid Solana address (base58 of 32 bytes, no leading zero bytes).
const createPubkey = (index: number) => {
    const bytes = new Uint8Array(32);
    bytes[0] = 1;
    bytes[30] = Math.floor(index / 256);
    bytes[31] = index % 256;

    return encodeBase58(bytes);
};

const DESCRIPTOR = createPubkey(1);
const RECOGNIZED_PUBKEY = createPubkey(2);
const DRAINED_PUBKEY = createPubkey(3);
const ZERO_BALANCE_PUBKEY = createPubkey(4);
const INVALID_PUBKEY = 'not-a-valid-pubkey';

const createTokenAccount = ({ pubkey, amount }: { pubkey: string; amount: string }) => ({
    pubkey,
    account: {
        data: {
            program: 'spl-token',
            parsed: {
                info: {
                    mint: RECOGNIZED_MINT,
                    tokenAmount: { amount, decimals: 6 },
                },
            },
        },
    },
});

const runGetAccountInfo = async ({
    tokenAccounts,
    tokenAccountsPubKeys,
}: {
    tokenAccounts: ReturnType<typeof createTokenAccount>[];
    tokenAccountsPubKeys: string[];
}) => {
    const scannedPubkeys: string[] = [];

    const send = <T>(value: T) => ({ send: () => Promise.resolve(value) });

    const api = {
        rpc: {
            getAccountInfo: () => send({ value: null }),
            getTokenAccountsByOwner: (_owner: unknown, filter: { programId: unknown }) =>
                send({
                    value:
                        String(filter.programId) === TOKEN_PROGRAM_PUBLIC_KEY ? tokenAccounts : [],
                }),
            getSignaturesForAddress: (pubkey: unknown) => {
                scannedPubkeys.push(String(pubkey));

                return send([]);
            },
            getEpochInfo: () => send({ epoch: 500n }),
        },
    } as unknown as SolanaAPI;

    const worker = SolanaWorker();
    worker.settings = { name: 'Solana', server: ['http://localhost'], debug: false };
    worker.tryConnect = () => Promise.resolve(api);

    const post = jest.fn();
    worker.post = post;

    await worker.messageHandler({
        data: {
            id: 1,
            type: MESSAGES.GET_ACCOUNT_INFO,
            payload: {
                descriptor: DESCRIPTOR,
                details: 'txids',
                tokenAccountsPubKeys,
            },
        },
    });

    const responses: Response[] = post.mock.calls.map(([response]) => response);

    return { scannedPubkeys, responses };
};

describe('Solana getAccountInfo txid scan', () => {
    it('scans known token account pubkeys missing from current recognized accounts', async () => {
        const { scannedPubkeys, responses } = await runGetAccountInfo({
            tokenAccounts: [
                createTokenAccount({ pubkey: RECOGNIZED_PUBKEY, amount: '1000' }),
                createTokenAccount({ pubkey: ZERO_BALANCE_PUBKEY, amount: '0' }),
            ],
            tokenAccountsPubKeys: [DRAINED_PUBKEY, RECOGNIZED_PUBKEY, INVALID_PUBKEY],
        });

        expect(responses).toContainEqual(
            expect.objectContaining({ id: 1, type: RESPONSES.GET_ACCOUNT_INFO }),
        );
        expect(scannedPubkeys).toHaveLength(3);
        expect(scannedPubkeys).toEqual(
            expect.arrayContaining([DESCRIPTOR, RECOGNIZED_PUBKEY, DRAINED_PUBKEY]),
        );
        expect(scannedPubkeys).not.toContain(ZERO_BALANCE_PUBKEY);
        expect(scannedPubkeys).not.toContain(INVALID_PUBKEY);
    });

    it('caps the number of scanned token accounts, keeping recognized ones', async () => {
        const knownPubkeys = Array.from({ length: TOKEN_ACCOUNTS_SCAN_LIMIT + 50 }, (_, index) =>
            createPubkey(100 + index),
        );

        const { scannedPubkeys } = await runGetAccountInfo({
            tokenAccounts: [createTokenAccount({ pubkey: RECOGNIZED_PUBKEY, amount: '1000' })],
            tokenAccountsPubKeys: knownPubkeys,
        });

        expect(scannedPubkeys).toHaveLength(1 + TOKEN_ACCOUNTS_SCAN_LIMIT);
        expect(scannedPubkeys).toContain(DESCRIPTOR);
        expect(scannedPubkeys).toContain(RECOGNIZED_PUBKEY);
    });
});
