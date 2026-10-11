import type { Utxo } from '@trezor/blockchain-link-types';

import type { AccountType } from './accountType';
import {
    type ComposeSweepParams,
    MAX_FEE_PADDING,
    MAX_SWEEP_INPUTS,
    SWEEP_FEE_RATE,
    composeSweep,
    getInputCost,
    planSweepBatches,
} from './composeSweep';
import { type Destination, validateDestination } from './destinationAddress';
import { mockUtxo } from '../../mocks/mockUtxo';
import { mockWallet } from '../../mocks/mockWallet';
import type { FirmwareVersion } from '../firmware/firmwareSupport';

const wallet = mockWallet();

const P2PKH_DESTINATION = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2';
const P2SH_DESTINATION = '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy';
const BECH32_DESTINATION = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';

const destinationFor = (
    input: string,
    firmwareVersion: FirmwareVersion = [1, 6, 3],
): Destination => {
    const destination = validateDestination({ input, firmwareVersion, ownScripts: new Set() });
    if (!destination.success) throw new Error('test destination must be valid');

    return destination.payload;
};

const accountUtxos = (accountType: AccountType, amounts: string[]): Utxo[] =>
    amounts.map((amount, addressIndex) =>
        mockUtxo({
            txid: addressIndex.toString(16).padStart(64, '0'),
            amount,
            address: wallet.getAddress({ accountType, addressIndex }),
            path: wallet.getAddressPath({ accountType, addressIndex }),
        }),
    );

const sum = (amounts: string[]) => amounts.reduce((total, amount) => total + BigInt(amount), 0n);

const DEFAULT_UTXOS = accountUtxos('p2pkh', ['100000', '250000']);

const params = (overrides: Partial<ComposeSweepParams> = {}): ComposeSweepParams => ({
    utxos: DEFAULT_UTXOS,
    accountType: 'p2pkh',
    destination: destinationFor(P2PKH_DESTINATION),
    firmwareVersion: [1, 6, 3],
    usedAmounts: new Set(),
    getRandomInt: () => 7,
    ...overrides,
});

const composeOrThrow = (overrides: Partial<ComposeSweepParams> = {}) => {
    const plan = composeSweep(params(overrides));
    if (!plan.success) throw new Error(`compose failed: ${plan.error.type}`);

    return plan.payload;
};

describe('fee constants', () => {
    it('uses the fixed fee rate of 50 sat/vB', () => {
        expect(SWEEP_FEE_RATE).toBe(50);
    });

    it.each<[AccountType, number]>([
        ['p2pkh', 7400],
        ['p2sh', 4550],
        ['p2wpkh', 3400],
    ])('prices one %s input at %i satoshi', (accountType, cost) => {
        expect(getInputCost(accountType)).toBe(cost);
    });
});

describe('composeSweep', () => {
    it('sends everything to a single output without change', () => {
        const plan = composeOrThrow();

        expect(plan.output).toEqual({
            address: P2PKH_DESTINATION,
            amount: plan.amount,
            script_type: 'PAYTOADDRESS',
        });
        expect(plan.output).not.toHaveProperty('address_n');
        expect(BigInt(plan.amount) + BigInt(plan.fee)).toBe(350000n);
    });

    it('spends every given output exactly once, with the default final sequence', () => {
        const utxos = accountUtxos('p2pkh', ['100000', '250000', '30000']);
        const plan = composeOrThrow({ utxos });

        expect(plan.inputs).toHaveLength(3);
        expect(new Set(plan.inputs.map(input => input.prev_hash))).toEqual(
            new Set(utxos.map(utxo => utxo.txid)),
        );
        plan.inputs.forEach(input => {
            expect(input).toMatchObject({ sequence: 0xffffffff, script_type: 'SPENDADDRESS' });
            expect(input.address_n).toHaveLength(5);
        });
    });

    it('charges the fixed rate for the transaction size plus the random satoshi', () => {
        const plan = composeOrThrow({ getRandomInt: () => 7 });

        // Two legacy inputs and one legacy output are 340 virtual bytes.
        expect(plan.virtualSize).toBe(340);
        expect(plan.feePadding).toBe(7);
        expect(plan.fee).toBe((340 * SWEEP_FEE_RATE + 7).toString());
    });

    it('asks for a random padding between one and the maximum', () => {
        const getRandomInt = jest.fn(() => 1);

        composeOrThrow({ getRandomInt });

        expect(getRandomInt).toHaveBeenCalledWith(1, MAX_FEE_PADDING + 1);
    });

    it('costs about 9 600 satoshi for one legacy input', () => {
        const plan = composeOrThrow({
            utxos: accountUtxos('p2pkh', ['100000']),
            getRandomInt: () => 1,
        });

        expect(plan.fee).toBe('9601');
    });

    it.each<[AccountType, string]>([
        ['p2pkh', 'SPENDADDRESS'],
        ['p2sh', 'SPENDP2SHWITNESS'],
        ['p2wpkh', 'SPENDWITNESS'],
    ])('types the inputs of a %s account as %s', (accountType, scriptType) => {
        const plan = composeOrThrow({
            accountType,
            utxos: accountUtxos(accountType, ['100000', '250000']),
        });

        expect(plan.inputs.map(input => input.script_type)).toEqual([scriptType, scriptType]);
    });

    it('sizes a SegWit sweep smaller than a legacy one', () => {
        const legacy = composeOrThrow();
        const segwit = composeOrThrow({
            accountType: 'p2wpkh',
            utxos: accountUtxos('p2wpkh', ['100000', '250000']),
        });

        expect(BigInt(segwit.fee)).toBeLessThan(BigInt(legacy.fee));
    });

    it('never produces an amount that was composed before', () => {
        const usedAmounts = new Set<string>();

        // More compositions than there are paddings would have to repeat an amount.
        for (let attempt = 0; attempt < MAX_FEE_PADDING; attempt++) {
            // Half of the draws repeat the previous one and have to move on to a free padding.
            const draw = Math.floor(attempt / 2) * 2 + 1;
            const plan = composeOrThrow({ usedAmounts, getRandomInt: () => draw });

            expect(usedAmounts.has(plan.amount)).toBe(false);
            usedAmounts.add(plan.amount);
        }

        expect(usedAmounts.size).toBe(MAX_FEE_PADDING);
        expect(composeSweep(params({ usedAmounts, getRandomInt: () => 7 }))).toEqual({
            success: false,
            error: { type: 'amount-not-unique' },
        });
    });

    it('moves to another padding when the random one would repeat an amount', () => {
        const first = composeOrThrow({ getRandomInt: () => 7 });
        const second = composeOrThrow({
            usedAmounts: new Set([first.amount]),
            getRandomInt: () => 7,
        });

        expect(second.feePadding).toBe(8);
        expect(second.amount).not.toBe(first.amount);
    });

    it('uses PAYTOSCRIPTHASH for a P2SH destination on firmware older than 1.5.0', () => {
        const destination = destinationFor(P2SH_DESTINATION, [1, 4, 2]);

        expect(composeOrThrow({ destination, firmwareVersion: [1, 4, 2] }).output.script_type).toBe(
            'PAYTOSCRIPTHASH',
        );
        expect(composeOrThrow({ destination, firmwareVersion: [1, 5, 0] }).output.script_type).toBe(
            'PAYTOADDRESS',
        );
    });

    it('refuses a destination format the firmware cannot pay to', () => {
        const destination = destinationFor(BECH32_DESTINATION, [1, 6, 3]);

        expect(composeSweep(params({ destination, firmwareVersion: [1, 5, 2] }))).toMatchObject({
            success: false,
            error: { type: 'invariant-violated' },
        });
        expect(composeSweep(params({ destination, firmwareVersion: [1, 6, 0] })).success).toBe(
            true,
        );
    });

    it('refuses a destination whose script does not belong to its address', () => {
        const destination = {
            ...destinationFor(P2PKH_DESTINATION),
            script: destinationFor(P2SH_DESTINATION).script,
        };

        expect(composeSweep(params({ destination }))).toMatchObject({
            success: false,
            error: { type: 'invariant-violated' },
        });
    });

    it('reports when the outputs cannot pay for their own transaction', () => {
        // Worth more than its input, but not enough for the rest of the transaction.
        expect(composeSweep(params({ utxos: accountUtxos('p2pkh', ['9000']) }))).toEqual({
            success: false,
            error: { type: 'insufficient-for-fee' },
        });
    });

    it('refuses to compose without inputs or with more inputs than the limit', () => {
        expect(composeSweep(params({ utxos: [] }))).toEqual({
            success: false,
            error: { type: 'no-spendable-utxos' },
        });

        const tooMany = accountUtxos('p2pkh', Array(MAX_SWEEP_INPUTS + 1).fill('100000'));
        expect(composeSweep(params({ utxos: tooMany }))).toMatchObject({
            success: false,
            error: { type: 'invariant-violated' },
        });
    });

    it('composes the largest allowed transaction', () => {
        const amounts = Array<string>(MAX_SWEEP_INPUTS).fill('100000');
        const plan = composeOrThrow({ utxos: accountUtxos('p2pkh', amounts) });

        expect(plan.inputs).toHaveLength(MAX_SWEEP_INPUTS);
        expect(BigInt(plan.amount) + BigInt(plan.fee)).toBe(sum(amounts));
    });

    it('rejects an output with a malformed derivation path', () => {
        const [utxo] = accountUtxos('p2pkh', ['100000']);

        expect(composeSweep(params({ utxos: [{ ...utxo!, path: 'm/not/a/path' }] }))).toEqual({
            success: false,
            error: { type: 'invalid-utxo' },
        });
    });

    it('refuses outputs that belong to a different account type', () => {
        expect(
            composeSweep(
                params({ accountType: 'p2wpkh', utxos: accountUtxos('p2pkh', ['100000']) }),
            ),
        ).toMatchObject({ success: false, error: { type: 'invariant-violated' } });
    });
});

describe('planSweepBatches', () => {
    it('skips outputs worth no more than the cost of their own input', () => {
        const utxos = accountUtxos('p2pkh', ['7399', '7400', '7401', '500000']);

        const { batches, leftovers } = planSweepBatches({ utxos, accountType: 'p2pkh' });

        expect(batches).toEqual([[utxos[3], utxos[2]]]);
        expect(leftovers).toEqual([
            { utxo: utxos[0], reason: 'uneconomic' },
            { utxo: utxos[1], reason: 'uneconomic' },
        ]);
    });

    it('applies the lower input cost of SegWit accounts', () => {
        const utxos = accountUtxos('p2wpkh', ['3400', '3401']);

        const { batches, leftovers } = planSweepBatches({ utxos, accountType: 'p2wpkh' });

        expect(batches).toEqual([[utxos[1]]]);
        expect(leftovers).toEqual([{ utxo: utxos[0], reason: 'uneconomic' }]);
    });

    it('never selects unconfirmed outputs', () => {
        const [confirmed, inMempool, withoutHeight] = accountUtxos('p2pkh', [
            '100000',
            '200000',
            '300000',
        ]);
        const utxos = [
            confirmed!,
            { ...inMempool!, confirmations: 0, blockHeight: -1 },
            { ...withoutHeight!, confirmations: 3, blockHeight: 0 },
        ];

        const { batches, leftovers } = planSweepBatches({ utxos, accountType: 'p2pkh' });

        expect(batches).toEqual([[confirmed]]);
        expect(leftovers.map(({ reason }) => reason)).toEqual(['unconfirmed', 'unconfirmed']);
    });

    it('sets aside mining rewards that are not mature yet', () => {
        const [immature, mature] = accountUtxos('p2pkh', ['5000000000', '5000000000']);
        const utxos = [
            { ...immature!, coinbase: true, confirmations: 99 },
            { ...mature!, coinbase: true, confirmations: 100 },
        ];

        const { batches, leftovers } = planSweepBatches({ utxos, accountType: 'p2pkh' });

        expect(batches).toEqual([[utxos[1]]]);
        expect(leftovers).toEqual([{ utxo: utxos[0], reason: 'immature-coinbase' }]);
    });

    it('caps a transaction at 50 inputs and puts the most valuable outputs first', () => {
        const amounts = Array.from({ length: 120 }, (_, index) => (100000 + index).toString());
        const utxos = accountUtxos('p2pkh', amounts);

        const { batches, leftovers } = planSweepBatches({ utxos, accountType: 'p2pkh' });

        expect(batches.map(batch => batch.length)).toEqual([50, 50, 20]);
        expect(batches[0]?.[0]?.amount).toBe('100119');
        expect(batches[2]?.at(-1)?.amount).toBe('100000');
        expect(leftovers).toEqual([]);
    });

    it('orders equal amounts deterministically', () => {
        const utxos = accountUtxos('p2pkh', ['100000', '100000', '100000']);

        const forward = planSweepBatches({ utxos, accountType: 'p2pkh' });
        const reversed = planSweepBatches({ utxos: utxos.toReversed(), accountType: 'p2pkh' });

        expect(reversed.batches).toEqual(forward.batches);
    });
});
