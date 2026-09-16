import type { Transaction, TransactionReceipt } from 'viem';

import { type TokenMetadata, mapTransaction } from './transaction';
import { TRANSFER_TOPIC } from '../history/constants';
import type { NativeLogSource } from '../history/nativeAsset';

const ME = '0xcAe32Cd53A96209fA02C0c0cfE165a5c97d456dF';
const OTHER = '0x1111111111111111111111111111111111111111';
const CONTRACT = '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a';
const SENTINEL = '0xfffffffffffffffffffffffffffffffffffffffe';
const NATIVE_VIEW = '0x3600000000000000000000000000000000000000';

const NATIVE_SOURCES: readonly NativeLogSource[] = [
    { address: SENTINEL, decimals: 18 },
    { address: NATIVE_VIEW, decimals: 6 },
];

const topic = (address: string) => `0x${address.slice(2).toLowerCase().padStart(64, '0')}`;
const word = (value: bigint) => `0x${value.toString(16).padStart(64, '0')}`;

const transferLog = (address: string, from: string, to: string, value: bigint) =>
    ({
        address: address.toLowerCase(),
        topics: [TRANSFER_TOPIC, topic(from), topic(to)],
        data: word(value),
    }) as unknown as TransactionReceipt['logs'][number];

const makeTx = (overrides: Partial<Transaction> = {}) =>
    ({
        hash: '0xdead',
        from: OTHER,
        to: ME,
        value: 0n,
        nonce: 7,
        gas: 21000n,
        gasPrice: 1_000_000_000n,
        input: '0x',
        blockHash: '0xblock',
        blockNumber: 100n,
        ...overrides,
    }) as unknown as Transaction;

const makeReceipt = (overrides: Partial<TransactionReceipt> = {}) =>
    ({
        status: 'success',
        gasUsed: 21000n,
        effectiveGasPrice: 1_000_000_000n,
        contractAddress: null,
        logs: [],
        ...overrides,
    }) as unknown as TransactionReceipt;

const FEE = (21000n * 1_000_000_000n).toString();

const map = (
    tx: Transaction,
    receipt: TransactionReceipt,
    tokenMetadata?: Map<string, TokenMetadata>,
) =>
    mapTransaction({
        tx,
        receipt,
        blockTime: 1_700_000_000,
        userAddress: ME,
        nativeSources: NATIVE_SOURCES,
        tokenMetadata,
    });

describe(mapTransaction.name, () => {
    it('classifies a native send', () => {
        const result = map(makeTx({ from: ME, to: OTHER, value: 5n }), makeReceipt());

        expect(result.type).toBe('sent');
        expect(result.amount).toBe('5');
        expect(result.targets).toHaveLength(1);
        expect(result.details.vin[0]?.isAccountOwned).toBe(true);
        expect(result.details.vout[0]?.isAccountOwned).toBe(false);
    });

    it('classifies a native receive', () => {
        const result = map(makeTx({ from: OTHER, to: ME, value: 5n }), makeReceipt());

        expect(result.type).toBe('recv');
        expect(result.amount).toBe('5');
        expect(result.details.vout[0]?.isAccountOwned).toBe(true);
    });

    it('reports a self-send with the fee as its amount, as blockbook does', () => {
        const result = map(makeTx({ from: ME, to: ME, value: 5n }), makeReceipt());

        expect(result.type).toBe('self');
        expect(result.amount).toBe(FEE);
    });

    it('matches the descriptor regardless of address casing', () => {
        const result = map(
            makeTx({ from: ME.toLowerCase() as `0x${string}`, to: OTHER, value: 1n }),
            makeReceipt(),
        );

        expect(result.type).toBe('sent');
    });

    it('marks a reverted mined transaction as failed', () => {
        const result = map(
            makeTx({ from: ME, to: OTHER, value: 5n }),
            makeReceipt({ status: 'reverted' }),
        );

        expect(result.type).toBe('failed');
        expect(result.ethereumSpecific?.status).toBe(0);
    });

    it('marks a contract creation', () => {
        const result = map(
            makeTx({ from: ME, to: null, value: 0n }),
            makeReceipt({ contractAddress: OTHER as `0x${string}` }),
        );

        expect(result.type).toBe('contract');
        expect(result.targets).toEqual([]);
        expect(result.ethereumSpecific?.createdContract).toBe(OTHER);
    });

    it('reads a token send out of the receipt logs', () => {
        const metadata = new Map<string, TokenMetadata>([
            [
                CONTRACT.toLowerCase(),
                { name: 'Euro Coin', symbol: 'EURC', decimals: 6, standard: 'ERC20' },
            ],
        ]);
        const result = map(
            makeTx({ from: ME, to: CONTRACT, value: 0n }),
            makeReceipt({ logs: [transferLog(CONTRACT, ME, OTHER, 1_500_000n)] }),
            metadata,
        );

        expect(result.type).toBe('sent');
        expect(result.amount).toBe('0');
        expect(result.tokens).toHaveLength(1);
        expect(result.tokens[0]).toMatchObject({
            type: 'sent',
            amount: '1500000',
            contract: CONTRACT.toLowerCase(),
            symbol: 'EURC',
            decimals: 6,
        });
    });

    it('reads a token receive even when the account is not the transaction target', () => {
        const result = map(
            makeTx({ from: OTHER, to: CONTRACT, value: 0n }),
            makeReceipt({ logs: [transferLog(CONTRACT, OTHER, ME, 42n)] }),
        );

        expect(result.type).toBe('recv');
        expect(result.tokens[0]?.type).toBe('recv');
        // unknown metadata must not silently become 0 decimals
        expect(result.tokens[0]?.decimals).toBe(18);
    });

    it('ignores token transfers between two strangers', () => {
        const result = map(
            makeTx({ from: OTHER, to: CONTRACT, value: 0n }),
            makeReceipt({ logs: [transferLog(CONTRACT, OTHER, OTHER, 42n)] }),
        );

        expect(result.tokens).toEqual([]);
        expect(result.type).toBe('unknown');
    });

    it('treats a mirrored native transfer as the transaction it belongs to, not a token', () => {
        const result = map(
            makeTx({ from: ME, to: OTHER, value: 13_000_000_000_000_000n }),
            makeReceipt({
                logs: [transferLog(SENTINEL, ME, OTHER, 13_000_000_000_000_000n)] as any,
            }),
        );

        expect(result.tokens).toEqual([]);
        expect(result.internalTransfers).toEqual([]);
        expect(result.type).toBe('sent');
        expect(result.amount).toBe('13000000000000000');
    });

    it('reports a mirrored native transfer made inside a contract call as an internal transfer', () => {
        const result = map(
            makeTx({ from: OTHER, to: CONTRACT, value: 0n }),
            makeReceipt({ logs: [transferLog(SENTINEL, CONTRACT, ME, 7n)] }),
        );

        expect(result.type).toBe('recv');
        expect(result.tokens).toEqual([]);
        expect(result.internalTransfers).toEqual([
            { type: 'recv', amount: '7', from: CONTRACT.toLowerCase(), to: ME.toLowerCase() },
        ]);
    });

    it('scales a lower-precision native mirror up to native decimals', () => {
        const result = map(
            makeTx({ from: OTHER, to: CONTRACT, value: 0n }),
            makeReceipt({ logs: [transferLog(NATIVE_VIEW, CONTRACT, ME, 9_913n)] }),
        );

        expect(result.internalTransfers[0]?.amount).toBe((9_913n * 10n ** 12n).toString());
    });

    it('counts a movement mirrored by two contracts only once', () => {
        const result = map(
            makeTx({ from: OTHER, to: CONTRACT, value: 0n }),
            makeReceipt({
                logs: [
                    transferLog(NATIVE_VIEW, CONTRACT, ME, 9_913n),
                    transferLog(SENTINEL, CONTRACT, ME, 9_913_568_508_319_474n),
                ] as any,
            }),
        );

        expect(result.internalTransfers).toHaveLength(1);
        // the sentinel wins: it carries the amount the lower-precision mirror had to round
        expect(result.internalTransfers[0]?.amount).toBe('9913568508319474');
    });

    it('cannot classify without a descriptor, and says so', () => {
        const result = mapTransaction({
            tx: makeTx({ from: ME, to: OTHER, value: 5n }),
            receipt: makeReceipt(),
            blockTime: 1,
        });

        expect(result.type).toBe('unknown');
        expect(result.details.vin[0]?.isAccountOwned).toBeUndefined();
    });
});
