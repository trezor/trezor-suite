import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type GeneralPrecomposedTransaction } from '@suite-common/wallet-types';
import { type TronAccountExtraData } from '@trezor/blockchain-link-types';

import {
    calculateTronFeeBreakdown,
    computeBandwidthFeeLevel,
    isTronAccountActivation,
} from './tronUtils';

const trxSymbol = asNetworkSymbol('trx');

const makeTrc20Tx = (overrides: Record<string, unknown> = {}): GeneralPrecomposedTransaction =>
    ({
        type: 'nonfinal',
        feePerByte: '100',
        feeLimit: '100000',
        bytes: 300,
        energyConsumed: 1000,
        token: { name: 'USDT', symbol: 'USDT', decimals: 6, balance: '100000000' },
        totalSpent: '0',
        inputs: [],
        ...overrides,
    }) as unknown as GeneralPrecomposedTransaction;

const makeNativeTrxTx = (overrides: Record<string, unknown> = {}): GeneralPrecomposedTransaction =>
    ({
        type: 'nonfinal',
        fee: '0',
        bytes: 300,
        totalSpent: '0',
        inputs: [],
        ...overrides,
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
    totalEnergyLimit: 0,
    totalEnergyWeight: 0,
    totalBandwidthLimit: 0,
    totalBandwidthWeight: 0,
    ...overrides,
});

describe(computeBandwidthFeeLevel.name, () => {
    it('returns zero fee when free bandwidth covers the transaction', () => {
        const result = computeBandwidthFeeLevel({
            availableStakedBandwidth: 0,
            availableFreeBandwidth: 300,
            bytes: 300,
        });
        expect(result.feePerTx).toBe('0');
    });

    it('charges the per-byte price when no bandwidth covers the transaction', () => {
        const result = computeBandwidthFeeLevel({
            availableStakedBandwidth: 0,
            availableFreeBandwidth: 0,
            bytes: 300,
        });
        expect(result.feePerTx).toBe('300000');
    });

    it('new account: free bandwidth is not accepted — charges the flat create-account fee', () => {
        // The network refuses free bandwidth for account-creating transfers and burns
        // the flat 0.1 TRX `getCreateAccountFee` instead of the per-byte price.
        const result = computeBandwidthFeeLevel({
            availableStakedBandwidth: 0,
            availableFreeBandwidth: 600,
            bytes: 300,
            isNewAccount: true,
        });
        expect(result.feePerTx).toBe('100000');
    });

    it('new account: staked bandwidth covers the transaction — zero fee', () => {
        const result = computeBandwidthFeeLevel({
            availableStakedBandwidth: 300,
            availableFreeBandwidth: 0,
            bytes: 300,
            isNewAccount: true,
        });
        expect(result.feePerTx).toBe('0');
    });

    it('new account: insufficient staked bandwidth — charges the flat create-account fee', () => {
        const result = computeBandwidthFeeLevel({
            availableStakedBandwidth: 100,
            availableFreeBandwidth: 0,
            bytes: 300,
            isNewAccount: true,
        });
        expect(result.feePerTx).toBe('100000');
    });
});

describe(isTronAccountActivation.name, () => {
    it('is true only when the transaction carries an activation fee', () => {
        expect(isTronAccountActivation(makeNativeTrxTx({ accountActivationFee: '1000000' }))).toBe(
            true,
        );
        expect(isTronAccountActivation(makeNativeTrxTx())).toBe(false);
        expect(isTronAccountActivation(makeTrc20Tx())).toBe(false);
    });

    it('is false for a missing or errored transaction', () => {
        expect(isTronAccountActivation(undefined)).toBe(false);
        expect(
            isTronAccountActivation({
                type: 'error',
                error: 'AMOUNT_IS_NOT_ENOUGH',
            } as GeneralPrecomposedTransaction),
        ).toBe(false);
    });
});

describe(calculateTronFeeBreakdown.name, () => {
    it('native TRX: has bandwidth — 0 TRX burned', () => {
        // Tx: bandwidth: 300
        // Account: bandwidth: 300, energy: 0
        // Expected: trxBurned: 0 TRX, coveredBandwidth: 300
        const result = calculateTronFeeBreakdown(makeNativeTrxTx(), makeTronResources(), trxSymbol);
        expect(result?.trxBurned.toNumber()).toBe(0);
        expect(result?.coveredBandwidth.toNumber()).toBe(300);
        expect(result?.isAccountActivation).toBe(false);
    });

    it('native TRX: no bandwidth — TRX burns bandwidth cost', () => {
        // Tx: bandwidth: 300, fee: 0.3 TRX
        // Account: bandwidth: 0, energy: 0
        // Expected: trxBurned: 0.3 TRX, coveredBandwidth: 0
        const result = calculateTronFeeBreakdown(
            makeNativeTrxTx({ fee: '300000' }),
            makeTronResources({ availableFreeBandwidth: 0 }),
            trxSymbol,
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
            trxSymbol,
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
            trxSymbol,
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
            trxSymbol,
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
            trxSymbol,
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
            trxSymbol,
            '110000',
        );
        expect(result?.trxBurned.toString()).toBe('0.01');
        expect(result?.coveredEnergy.toNumber()).toBe(1000);
    });

    it('native TRX to new account: burns the create-account fee and the activation fee', () => {
        // Tx: bandwidth: 300, fee: 0.1 create-account + 1 activation
        // Account: free bandwidth: 300, staked bandwidth: 0
        // Expected: trxBurned: 1.1 TRX, coveredBandwidth: 0 (free bandwidth is not accepted)
        const tx = makeNativeTrxTx({ fee: '1100000', accountActivationFee: '1000000' });
        const result = calculateTronFeeBreakdown(tx, makeTronResources(), trxSymbol);
        expect(result?.trxBurned.toString()).toBe('1.1');
        expect(result?.coveredBandwidth.toNumber()).toBe(0);
        expect(result?.isAccountActivation).toBe(true);
    });

    it('native TRX to new account: staked bandwidth covers — only the activation fee is burned', () => {
        // Tx: bandwidth: 300, fee: 1 activation (bandwidth covered by stake)
        // Account: free bandwidth: 0, staked bandwidth: 300
        // Expected: trxBurned: 1 TRX, coveredBandwidth: 300
        const tx = makeNativeTrxTx({ fee: '1000000', accountActivationFee: '1000000' });
        const result = calculateTronFeeBreakdown(
            tx,
            makeTronResources({ availableFreeBandwidth: 0, availableStakedBandwidth: 300 }),
            trxSymbol,
        );
        expect(result?.trxBurned.toString()).toBe('1');
        expect(result?.coveredBandwidth.toNumber()).toBe(300);
    });

    it('native TRX with memo: adds 1 TRX memo fee on top of bandwidth', () => {
        // Tx: bandwidth: 300, fee: 1 TRX memo (bandwidth covered)
        // Account: bandwidth: 300
        // Expected: trxBurned: 1 TRX (memo only, bandwidth covered)
        const tx = makeNativeTrxTx({ fee: '1000000', memoFee: '1000000' });
        const result = calculateTronFeeBreakdown(tx, makeTronResources(), trxSymbol);
        expect(result?.trxBurned.toString()).toBe('1');
        expect(result?.coveredBandwidth.toNumber()).toBe(300);
    });

    it('TRC-20 with memo: adds 1 TRX memo fee on top of energy/bandwidth', () => {
        // Tx: bandwidth: 300, energy: 1000, memo fee: 1 TRX
        // Account: bandwidth: 300, energy: 1000
        // Expected: trxBurned: 1 TRX (memo only, bandwidth+energy covered)
        const tx = makeTrc20Tx({ memoFee: '1000000' });
        const result = calculateTronFeeBreakdown(
            tx,
            makeTronResources({ availableEnergy: 1000 }),
            trxSymbol,
        );
        expect(result?.trxBurned.toString()).toBe('1');
        expect(result?.coveredBandwidth.toNumber()).toBe(300);
        expect(result?.coveredEnergy.toNumber()).toBe(1000);
    });
});
