import { type SpendableOutput, buildOwnedInputs } from '../buildInputs';
import type { DaemonOutput, MoneroDaemonRpc } from '../daemonRpc';

const fill = (byte: number) => new Uint8Array(32).fill(byte & 0xff);

// Deterministic stub: each global index maps to a recognizable key/commitment so the assembly can be
// asserted. amount must always be 0 (RingCT).
const stubDaemon = (calls: { amount: number; index: number }[][] = []) =>
    ({
        getOuts: (outputs: { amount: number | bigint; index: number | bigint }[]) => {
            calls.push(outputs.map(o => ({ amount: Number(o.amount), index: Number(o.index) })));

            return Promise.resolve(
                outputs.map(
                    (o): DaemonOutput => ({
                        key: fill(Number(o.index)),
                        mask: fill(Number(o.index) + 100),
                        height: 1,
                        unlocked: true,
                    }),
                ),
            );
        },
    }) satisfies Pick<MoneroDaemonRpc, 'getOuts'>;

const output: SpendableOutput = {
    amount: 1000,
    globalIndex: 50,
    realOutTxKey: 'aa'.repeat(32),
    realOutputInTxIndex: 1,
    subaddrMinor: 0,
    mask: 'bb'.repeat(32),
};

describe('buildOwnedInputs', () => {
    it('assembles an OwnedInput with the real output first and decoys fetched from get_outs', async () => {
        const calls: { amount: number; index: number }[][] = [];
        const selectDecoys = () => [10, 20, 30];

        const [input] = await buildOwnedInputs([output], stubDaemon(calls), selectDecoys, 4);

        // get_outs queried with amount 0 for [real, ...decoys].
        expect(calls[0]).toEqual([
            { amount: 0, index: 50 },
            { amount: 0, index: 10 },
            { amount: 0, index: 20 },
            { amount: 0, index: 30 },
        ]);

        expect(input).toEqual({
            amount: 1000,
            real: { globalIndex: 50, dest: fill(50), commitment: fill(150) },
            decoys: [
                { globalIndex: 10, dest: fill(10), commitment: fill(110) },
                { globalIndex: 20, dest: fill(20), commitment: fill(120) },
                { globalIndex: 30, dest: fill(30), commitment: fill(130) },
            ],
            mask: 'bb'.repeat(32),
            realOutTxKey: 'aa'.repeat(32),
            realOutAdditionalTxKeys: undefined,
            realOutputInTxIndex: 1,
            subaddrMinor: 0,
        });
    });

    it('requests ringSize-1 decoys', async () => {
        let requestedCount = -1;
        const selectDecoys = (count: number) => {
            requestedCount = count;

            return Array.from({ length: count }, (_, i) => 100 + i);
        };
        await buildOwnedInputs([output], stubDaemon(), selectDecoys, 11);
        expect(requestedCount).toBe(10);
    });

    it('throws when get_outs returns fewer members than requested', async () => {
        const shortDaemon: Pick<MoneroDaemonRpc, 'getOuts'> = {
            getOuts: () =>
                Promise.resolve([{ key: fill(1), mask: fill(2), height: 1, unlocked: true }]),
        };
        await expect(buildOwnedInputs([output], shortDaemon, () => [1, 2, 3], 4)).rejects.toThrow(
            /get_outs returned/,
        );
    });

    it('rejects an invalid ring size', async () => {
        await expect(buildOwnedInputs([output], stubDaemon(), () => [], 0)).rejects.toThrow(
            /ringSize/,
        );
    });
});
