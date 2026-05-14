import { sha256 } from '@noble/hashes/sha2.js';
import { base58check as createBase58check } from '@scure/base';

import { isCashAddress, toCashAddress, toLegacyAddress } from '../src/bchUtils';

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

    describe('P2SH mainnet conversion', () => {
        // P2SH mainnet legacy address (version byte 0x05) — encodes hash160 76a04053bda0a88bda5177b86a15c3b29f559873.
        // The cashaddr type byte for P2SH 160-bit hash is 0x08 (vs 0x00 for P2PKH), so its base32 prefix is 'p' (not 'q').
        const mainnetLegacyP2SH = '3CWFddi6m4ndiGyKqzYvsFYagqDLPVMTzC';

        it('round-trips a P2SH mainnet legacy address through cashaddr form', () => {
            const cashAddr = toCashAddress(mainnetLegacyP2SH);
            expect(cashAddr).toMatch(/^bitcoincash:p/);
            expect(toLegacyAddress(cashAddr)).toBe(mainnetLegacyP2SH);
        });
    });

    describe('P2SH testnet conversion', () => {
        // P2SH testnet legacy address (version byte 0xc4) — encodes hash160 76a04053bda0a88bda5177b86a15c3b29f559873.
        // Testnet P2SH base58 addresses begin with '2' (version 0xc4); the testnet cashaddr prefix is 'bchtest'.
        const testnetLegacyP2SH = '2N44ThNe8NXHyv4bsX8AoVCXquBRW94Ls7W';

        it('round-trips a P2SH testnet legacy address through cashaddr form', () => {
            const cashAddr = toCashAddress(testnetLegacyP2SH);
            expect(cashAddr).toMatch(/^bchtest:p/);
            expect(toLegacyAddress(cashAddr)).toBe(testnetLegacyP2SH);
        });
    });

    describe('decodeBase58Address unknown version byte', () => {
        it('throws on a base58check address whose version byte is none of 0x00/0x05/0x6f/0xc4', () => {
            // Construct a base58check-encoded 21-byte payload with version byte 0x01.
            // bs58check.decode succeeds (valid checksum, length 21), but the switch in
            // decodeBase58Address has no case for 0x01 and falls into the default-arm
            // 'Unknown version byte' throw — which propagates as 'Invalid Bitcoin Cash address'
            // because decodeCashAddress also fails for the same string.
            const bs58check = createBase58check(sha256);
            const payload = new Uint8Array(21);
            payload[0] = 0x01;
            const unknownVersionAddr = bs58check.encode(payload);
            expect(() => isCashAddress(unknownVersionAddr)).toThrow('Invalid Bitcoin Cash address');
        });
    });
});
