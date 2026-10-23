import { getOriginalTxids, getPreviousTxids } from './refTransactions';

describe('refTransactions', () => {
    it('getPreviousTxids', () => {
        const segwit = { script_type: 'SPENDWITNESS', prev_hash: 'segwit' } as any;
        const taproot = { script_type: 'SPENDTAPROOT', prev_hash: 'taproot' } as any;
        const external = { script_type: 'EXTERNAL', prev_hash: 'external' } as any;

        expect(getPreviousTxids([segwit])).toEqual(['segwit']);
        expect(getPreviousTxids([segwit, taproot])).toEqual(['segwit', 'taproot']);
        expect(getPreviousTxids([taproot, taproot, taproot])).toEqual([]);
        expect(getPreviousTxids([taproot, external])).toEqual([]);

        // zcash v5
        expect(getPreviousTxids([segwit], { version: 4 }, { shortcut: 'ZEC' })).toEqual(['segwit']);
        expect(getPreviousTxids([segwit], { version: 4 }, { shortcut: 'TAZ' })).toEqual(['segwit']);
        expect(getPreviousTxids([segwit], { version: 5 }, { shortcut: 'ZEC' })).toEqual([]);
        expect(getPreviousTxids([segwit], { version: 5 }, { shortcut: 'TAZ' })).toEqual([]);

        const inputs = [segwit, taproot, external, taproot, segwit, external];
        const result = ['segwit', 'taproot', 'external'];
        expect(getPreviousTxids(inputs)).toEqual(result);
    });

    it('getOriginalTxids', () => {
        const a = { orig_hash: 'a' } as any;
        const b = { orig_hash: 'b' } as any;
        expect(getOriginalTxids([a], [])).toEqual(['a']);
        expect(getOriginalTxids([], [b])).toEqual(['b']);
        expect(getOriginalTxids([a, b], [b, a])).toEqual(['a', 'b']);
    });
});
