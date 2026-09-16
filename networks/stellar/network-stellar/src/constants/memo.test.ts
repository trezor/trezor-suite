import { fitStellarMemoText } from './memo';

describe(fitStellarMemoText.name, () => {
    it('keeps a name that fits', () => {
        expect(fitStellarMemoText('USD Coin')).toBe('USD Coin');
    });

    it('trims a name that does not fit into a 28 byte text memo', () => {
        expect(fitStellarMemoText('A token with a very long name')).toBe(
            'A token with a very long nam',
        );
    });

    it('trims multi byte characters whole', () => {
        expect(fitStellarMemoText('求'.repeat(10))).toBe('求'.repeat(9));
    });

    it('returns an empty string for a blank name', () => {
        expect(fitStellarMemoText('   ')).toBe('');
    });
});
