import { getFormattedAccountType, getFormattedAccountTypeWithDefault } from './accountsConstants';

describe('getFormattedAccountType', () => {
    it('returns no label for default account types', () => {
        expect(getFormattedAccountType('bitcoin', 'normal')).toBeNull();
        expect(getFormattedAccountType('ethereum', 'normal')).toBeNull();
        expect(getFormattedAccountType('cardano', 'normal')).toBeNull();
    });

    it('returns labels for non-default bitcoin account types', () => {
        expect(getFormattedAccountType('bitcoin', 'taproot')).toBe('Taproot');
        expect(getFormattedAccountType('bitcoin', 'segwit')).toBe('Legacy SegWit');
        expect(getFormattedAccountType('bitcoin', 'legacy')).toBe('Legacy');
    });

    it('returns labels for non-default account types of other networks', () => {
        expect(getFormattedAccountType('cardano', 'legacy')).toBe('Legacy');
        expect(getFormattedAccountType('cardano', 'ledger')).toBe('Ledger');
    });
});

describe('getFormattedAccountTypeWithDefault', () => {
    it('returns SegWit for the default bitcoin account type', () => {
        expect(getFormattedAccountTypeWithDefault('bitcoin', 'normal')).toBe('SegWit');
    });

    it('returns Default for default account types of other networks', () => {
        expect(getFormattedAccountTypeWithDefault('ethereum', 'normal')).toBe('Default');
    });

    it('returns labels for non-default bitcoin account types', () => {
        expect(getFormattedAccountTypeWithDefault('bitcoin', 'taproot')).toBe('Taproot');
        expect(getFormattedAccountTypeWithDefault('bitcoin', 'segwit')).toBe('Legacy SegWit');
        expect(getFormattedAccountTypeWithDefault('bitcoin', 'legacy')).toBe('Legacy');
    });
});
