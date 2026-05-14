import { type GeneralPrecomposedTransaction } from '@suite-common/wallet-types';
import { type TronAccountExtraData } from '@trezor/blockchain-link-types';

import { calculateTronFeeBreakdown } from '../tronUtils';

const makeTrc20Tx = (overrides: Record<string, unknown> = {}): GeneralPrecomposedTransaction =>
    ({
        type: 'nonfinal',
        feePerByte: '100',
        bytes: 300,
        energyConsumed: 1000,
        token: { name: 'USDT', symbol: 'USDT', decimals: 6, balance: '100000000' },
        totalSpent: '0',
        inputs: [],
        ...overrides,
    }) as unknown as GeneralPrecomposedTransaction;

const makeNativeTrxTx = (): GeneralPrecomposedTransaction =>
    ({
        type: 'nonfinal',
        bytes: 300,
        totalSpent: '0',
        inputs: [],
    }) as unknown as GeneralPrecomposedTransaction;

const makeTronResources = (
    overrides: Partial<TronAccountExtraData> = {},
): TronAccountExtraData => ({
    availableStakedBandwidth: 0,
    totalStakedBandwidth: 0,
    availableFreeBandwidth: 300,
    totalFreeBandwidth: 300,
    availableEnergy: 0,
    totalEnergy: 0,
    ...overrides,
});

describe(calculateTronFeeBreakdown.name, () => {
    it('native TRX: has bandwidth — 0 TRX burned', () => {
        // Tx: bandwidth: 300
        // Account: bandwidth: 300, energy: 0
        // Expected: trxBurned: 0 TRX, coveredBandwidth: 300
        const result = calculateTronFeeBreakdown(makeNativeTrxTx(), makeTronResources(), 'trx');
        expect(result?.trxBurned.toNumber()).toBe(0);
        expect(result?.coveredBandwidth.toNumber()).toBe(300);
    });

    it('native TRX: no bandwidth — TRX burns bandwidth cost', () => {
        // Tx: bandwidth: 300
        // Account: bandwidth: 0, energy: 0
        // Expected: trxBurned: 0.3 TRX, coveredBandwidth: 0
        const result = calculateTronFeeBreakdown(
            makeNativeTrxTx(),
            makeTronResources({ availableFreeBandwidth: 0 }),
            'trx',
        );
        expect(result?.trxBurned.toString()).toBe('0.3');
        expect(result?.coveredBandwidth.toNumber()).toBe(0);
    });

    it('TRC-20: has bandwidth, has energy — 0 TRX burned', () => {
        // Tx: bandwidth: 300, energy: 1000
        // Account: bandwidth: 300, energy: 1000
        // Expected: trxBurned: 0 TRX, coveredBandwidth: 300, coveredEnergy: 1000
        const result = calculateTronFeeBreakdown(
            makeTrc20Tx(),
            makeTronResources({ availableEnergy: 1000 }),
            'trx',
        );
        expect(result?.trxBurned.toNumber()).toBe(0);
        expect(result?.coveredBandwidth.toNumber()).toBe(300);
        expect(result?.coveredEnergy.toNumber()).toBe(1000);
    });

    it('TRC-20: has bandwidth, partial energy — TRX burns the rest', () => {
        // Tx: bandwidth: 300, energy: 1000
        // Account: bandwidth: 300, energy: 400
        // Expected: trxBurned: 0.06 TRX, coveredBandwidth: 300, coveredEnergy: 400
        const result = calculateTronFeeBreakdown(
            makeTrc20Tx(),
            makeTronResources({ availableEnergy: 400 }),
            'trx',
        );
        expect(result?.trxBurned.toString()).toBe('0.06');
        expect(result?.coveredBandwidth.toNumber()).toBe(300);
        expect(result?.coveredEnergy.toNumber()).toBe(400);
    });

    it('TRC-20: has bandwidth, no energy — TRX burns all', () => {
        // Tx: bandwidth: 300, energy: 1000
        // Account: bandwidth: 300, energy: 0
        // Expected: trxBurned: 0.1 TRX, coveredBandwidth: 300, coveredEnergy: 0
        const result = calculateTronFeeBreakdown(
            makeTrc20Tx(),
            makeTronResources({ availableEnergy: 0 }),
            'trx',
        );
        expect(result?.trxBurned.toString()).toBe('0.1');
        expect(result?.coveredBandwidth.toNumber()).toBe(300);
        expect(result?.coveredEnergy.toNumber()).toBe(0);
    });

    it('TRC-20: no bandwidth, has energy — TRX burns bandwidth cost', () => {
        // Tx: bandwidth: 300, energy: 1000, fee_limit: 0.1 TRX
        // Account: bandwidth: 0, energy: 1000
        // Expected: trxBurned: 0.3 TRX, coveredBandwidth: 0, coveredEnergy: 1000
        const result = calculateTronFeeBreakdown(
            makeTrc20Tx(),
            makeTronResources({ availableEnergy: 1000, availableFreeBandwidth: 0 }),
            'trx',
            '100000',
        );
        expect(result?.trxBurned.toString()).toBe('0.3');
        expect(result?.coveredBandwidth.toNumber()).toBe(0);
        expect(result?.coveredEnergy.toNumber()).toBe(1000);
    });

    it('TRC-20: fee_limit raised 10% with full energy coverage — shows TRX for buffer', () => {
        // Tx: bandwidth: 300, energy: 1000, fee_limit: 0.11 TRX
        // Account: bandwidth: 300, energy: 1000
        // Expected: trxBurned: 0.01 TRX, coveredEnergy: 1000
        const result = calculateTronFeeBreakdown(
            makeTrc20Tx(),
            makeTronResources({ availableEnergy: 1000 }),
            'trx',
            '110000',
        );
        expect(result?.trxBurned.toString()).toBe('0.01');
        expect(result?.coveredEnergy.toNumber()).toBe(1000);
    });
});
