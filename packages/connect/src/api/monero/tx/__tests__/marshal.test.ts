import { composeMoneroTransaction } from '../buildTransaction';
import { buildDestination } from '../destination';
import { hexToBytes } from '../hex';
import { type RingOutput, buildRing, toAbsoluteOffsets, toRelativeOffsets } from '../ring';

const key = (fill: number) => new Uint8Array(32).fill(fill);
const ringOutput = (globalIndex: number, fill: number): RingOutput => ({
    globalIndex,
    dest: key(fill),
    commitment: key(fill + 1),
});

describe('ring assembly', () => {
    it('sorts the ring ascending by global index and tracks the real output position', () => {
        const real = ringOutput(102, 0xaa);
        const decoys = [ringOutput(5000, 0x10), ringOutput(5, 0x20), ringOutput(100, 0x30)];

        const { outputs, realOutput } = buildRing(real, decoys);

        expect(outputs.map(o => o.idx)).toEqual([5, 100, 102, 5000]);
        expect(realOutput).toBe(2); // 102 is at sorted position 2
        expect(outputs[realOutput]?.key.dest).toBe('aa'.repeat(32));
        expect(outputs[0]?.key.commitment).toBe('21'.repeat(32));
    });

    it('rejects duplicate output indices', () => {
        expect(() => buildRing(ringOutput(7, 1), [ringOutput(7, 2)])).toThrow('duplicate');
    });

    it('converts between absolute indices and relative key_offsets', () => {
        const indices = [5, 100, 102, 5000];
        expect(toRelativeOffsets(indices)).toEqual([5, 95, 2, 4898]);
        expect(toAbsoluteOffsets(toRelativeOffsets(indices))).toEqual(indices);
    });
});

describe('destination marshaling', () => {
    const DONATION =
        '44AFFq5kSiGBoZ4NMDwYtN18obc8AemS33DBLWs3H7otXft3XjrpDtQGv7SqSsaBYBb98uNbr2VBBEt7f2wfn3RVGQBEP3A';

    it('builds a destination entry from an address + amount', () => {
        const dest = buildDestination(DONATION, 1_000_000_000_000);

        expect(dest.amount).toBe(1_000_000_000_000);
        expect(dest.original).toBe(DONATION);
        expect(dest.is_subaddress).toBe(false);
        expect(dest.is_integrated).toBe(false);
        expect(dest.addr.spend_public_key).toBe(
            '42f18fc61586554095b0799b5c4b6f00cdeb26a93b20540d366932c6001617b7',
        );
        // The marshaled spend key must decode back to the same 32 bytes.
        expect(hexToBytes(dest.addr.view_public_key)).toHaveLength(32);
    });
});

describe('composeMoneroTransaction', () => {
    const DONATION =
        '44AFFq5kSiGBoZ4NMDwYtN18obc8AemS33DBLWs3H7otXft3XjrpDtQGv7SqSsaBYBb98uNbr2VBBEt7f2wfn3RVGQBEP3A';

    const ownedInput = (amount: number, realIndex: number) => ({
        amount,
        real: ringOutput(realIndex, 0xaa),
        // 15 decoys with distinct indices -> ring size 16, mixin 15.
        decoys: Array.from({ length: 15 }, (_, i) => ringOutput(1000 + i, i + 1)),
        mask: 'cc'.repeat(32),
        realOutTxKey: 'dd'.repeat(32),
        realOutputInTxIndex: 1,
        subaddrMinor: 0,
    });

    it('assembles tsx_data + source entries with change', () => {
        const { tsxData, inputs } = composeMoneroTransaction({
            inputs: [ownedInput(2_000_000_000_000, 100)],
            destinations: [{ address: DONATION, amount: 1_000_000_000_000 }],
            changeAddress: DONATION,
            fee: 10_000_000_000,
        });

        expect(inputs).toHaveLength(1);
        expect(inputs[0]?.outputs).toHaveLength(16);
        expect(inputs[0]?.rct).toBe(true);
        expect(inputs[0]?.outputs[inputs[0].real_output]?.key.dest).toBe('aa'.repeat(32));

        expect(tsxData.num_inputs).toBe(1);
        expect(tsxData.mixin).toBe(15);
        // outputs include the recipient + the change; change_dts references the change entry.
        expect(tsxData.outputs).toHaveLength(2);
        const expectedChange = 2_000_000_000_000 - 1_000_000_000_000 - 10_000_000_000;
        expect(tsxData.outputs[1]?.amount).toBe(expectedChange);
        expect(tsxData.change_dts?.amount).toBe(expectedChange);
        expect(tsxData.rsig_data).toEqual({ rsig_type: 1, bp_version: 4, grouping: [2] });
        expect(tsxData.client_version).toBe(3);
        expect(tsxData.hard_fork).toBe(16);
    });

    it('omits change when inputs exactly cover destinations + fee', () => {
        const { tsxData } = composeMoneroTransaction({
            inputs: [ownedInput(1_010_000_000_000, 100), ownedInput(1_000_000_000, 200)],
            destinations: [
                { address: DONATION, amount: 1_000_000_000_000 },
                { address: DONATION, amount: 1_000_000_000 },
            ],
            changeAddress: DONATION,
            fee: 10_000_000_000,
        });

        expect(tsxData.change_dts).toBeUndefined();
        expect(tsxData.num_inputs).toBe(2);
        expect(tsxData.rsig_data.grouping).toEqual([2]); // two destinations, no change
    });

    it('rejects when inputs do not cover destinations + fee', () => {
        expect(() =>
            composeMoneroTransaction({
                inputs: [ownedInput(1_000_000_000, 100)],
                destinations: [{ address: DONATION, amount: 1_000_000_000_000 }],
                changeAddress: DONATION,
                fee: 10_000_000_000,
            }),
        ).toThrow('do not cover');
    });

    it('adds a dummy zero-amount change output for an exact-change single destination', () => {
        // wallet2 never emits a single-output RingCT tx; an exact-change single-recipient spend gets
        // a 0-amount change output so the tx has the >= 2 outputs consensus requires.
        const { tsxData } = composeMoneroTransaction({
            inputs: [ownedInput(1_010_000_000_000, 100)],
            destinations: [{ address: DONATION, amount: 1_000_000_000_000 }],
            changeAddress: DONATION,
            fee: 10_000_000_000, // inputs - destination - fee === 0
        });

        expect(tsxData.outputs).toHaveLength(2);
        expect(tsxData.outputs[1]?.amount).toBe(0);
        expect(tsxData.change_dts?.amount).toBe(0);
        expect(tsxData.rsig_data.grouping).toEqual([2]);
    });
});
