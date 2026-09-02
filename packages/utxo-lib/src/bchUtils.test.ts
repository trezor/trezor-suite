import { isCashAddress, toCashAddress, toLegacyAddress } from './bchUtils';

describe('bcashutils', () => {
    const mainnetCashAddr = 'bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a';
    const mainnetLegacy = '1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu';
    const testnetCashAddr = 'bchtest:qregmr8wn2yzhg7wgxsdakkc93g7yh3anvnxaqskqf';
    const testnetLegacy = 'mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn';
    const invalidAddr = 'notARealAddress123';

    describe('isCashAddress', () => {
        it('returns true for valid cashaddr', () => {
            expect(isCashAddress(mainnetCashAddr)).toBe(true);
            expect(isCashAddress(testnetCashAddr)).toBe(true);
        });
        it('returns false for legacy addresses', () => {
            expect(isCashAddress(mainnetLegacy)).toBe(false);
            expect(isCashAddress(testnetLegacy)).toBe(false);
        });
        it('throws for invalid address', () => {
            expect(() => isCashAddress(invalidAddr)).toThrow();
        });
    });

    describe('toLegacyAddress', () => {
        it('converts mainnet cashaddr to legacy', () => {
            expect(toLegacyAddress(mainnetCashAddr)).toBe(mainnetLegacy);
        });
        it('returns legacy address unchanged', () => {
            expect(toLegacyAddress(mainnetLegacy)).toBe(mainnetLegacy);
        });
        it('throws for invalid address', () => {
            expect(() => toLegacyAddress(invalidAddr)).toThrow();
        });
    });

    describe('toCashAddress', () => {
        it('converts mainnet legacy to cashaddr', () => {
            expect(toCashAddress(mainnetLegacy)).toBe(mainnetCashAddr);
        });
        it('returns cashaddr unchanged', () => {
            expect(toCashAddress(mainnetCashAddr)).toBe(mainnetCashAddr);
        });
        it('throws for invalid address', () => {
            expect(() => toCashAddress(invalidAddr)).toThrow();
        });
    });
});
