import { normalizeLabel } from './normalizeLabel';

describe(normalizeLabel.name, () => {
    it('trims surrounding whitespace', () => {
        expect(normalizeLabel('  My label\t')).toBe('My label');
    });

    it('turns empty and whitespace-only labels into null', () => {
        expect(normalizeLabel('')).toBeNull();
        expect(normalizeLabel('   ')).toBeNull();
        expect(normalizeLabel(null)).toBeNull();
    });
});
