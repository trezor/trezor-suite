import * as fixtures from './__fixtures__/refTx';
import { getOriginalTxids, getPreviousTxids, transformRawTransactions } from './refTx';

describe('core/methods/tx/refTx', () => {
    it('getPreviousTxids', () => {
        const segwit = { script_type: 'SPENDWITNESS', prev_hash: 'segwit' } as any;
        const taproot = { script_type: 'SPENDTAPROOT', prev_hash: 'taproot' } as any;
        const external = { script_type: 'EXTERNAL', prev_hash: 'external' } as any;

        expect(getPreviousTxids([segwit], 'btc')).toEqual(['segwit']);
        expect(getPreviousTxids([segwit, taproot], 'btc')).toEqual(['segwit', 'taproot']);
        expect(getPreviousTxids([taproot, taproot, taproot], 'btc')).toEqual([]);
        expect(getPreviousTxids([taproot, external], 'btc')).toEqual([]);

        // zcash v5
        expect(getPreviousTxids([segwit], 'zec', { version: 4 })).toEqual(['segwit']);
        expect(getPreviousTxids([segwit], 'taz', { version: 4 })).toEqual(['segwit']);
        expect(getPreviousTxids([segwit], 'zec', { version: 5 })).toEqual([]);
        expect(getPreviousTxids([segwit], 'taz', { version: 5 })).toEqual([]);

        const inputs = [segwit, taproot, external, taproot, segwit, external];
        const result = ['segwit', 'taproot', 'external'];
        expect(getPreviousTxids(inputs, 'btc')).toEqual(result);
    });

    it('getOriginalTxids', () => {
        const a = { orig_hash: 'a' } as any;
        const b = { orig_hash: 'b' } as any;
        expect(getOriginalTxids([a], [])).toEqual(['a']);
        expect(getOriginalTxids([], [b])).toEqual(['b']);
        expect(getOriginalTxids([a, b], [b, a])).toEqual(['a', 'b']);
    });

    describe('transformRawTransactions', () => {
        fixtures.transformRawTransactions.forEach(f => {
            it(` ${f.description}`, () => {
                if (f.error) {
                    expect(() => transformRawTransactions(f.params as any)).toThrow(f.error);
                } else {
                    expect(transformRawTransactions(f.params as any)).toEqual(f.result);
                }
            });
        });
    });
});
