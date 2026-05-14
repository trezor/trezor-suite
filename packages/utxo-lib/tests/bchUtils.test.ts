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

    describe('decodeBase58Address invalid payload length', () => {
        it('throws on a base58check address whose decoded payload is not 21 bytes', () => {
            // Construct a base58check-encoded 20-byte payload (one byte short).
            // bs58check.decode succeeds (valid checksum), but the explicit length guard at
            // bchUtils.ts:44 (`if (payload.length !== 21) throw`) fires before the version
            // switch. The error is caught by decodeAddress's try/catch, decodeCashAddress
            // also fails, and the public-API throw surfaces as 'Invalid Bitcoin Cash address'.
            const bs58check = createBase58check(sha256);
            const shortPayload = new Uint8Array(20);
            const shortAddr = bs58check.encode(shortPayload);
            expect(() => isCashAddress(shortAddr)).toThrow('Invalid Bitcoin Cash address');
        });
    });

    describe('decodeCashAddressWithPrefix unknown cashaddr prefix', () => {
        it('throws on a cashaddr-encoded address whose prefix is not bitcoincash/bchtest/bchreg', () => {
            // Construct a cashaddr-encoded address with a non-standard prefix 'simpleledger'.
            // cashaddrjs.encode rejects any prefix outside {bitcoincash, bchtest, bchreg},
            // but cashaddrjs.decode accepts any prefix as long as the checksum is valid for
            // that prefix string (the prefix is used as polymod salt). We replicate the
            // cashaddr encoding algorithm with native BigInt for the polymod to produce a
            // checksum that is valid under the custom prefix, which makes
            // decodeCashAddressWithPrefix's internal cashaddr.decode call succeed and fall
            // into the switch's default-arm at src/bchUtils.ts:73-74 ('Unknown cashaddr
            // prefix' throw). The error is caught by decodeAddress's try/catch and surfaces
            // as 'Invalid Bitcoin Cash address' at the public API.
            const customPrefix = 'simpleledger';
            const hash = new Uint8Array(20); // 20-byte zero hash, P2PKH 160-bit
            const versionByte = 0;

            const to5Bit = (data: Uint8Array): Uint8Array => {
                const result: number[] = [];
                let acc = 0;
                let bits = 0;
                for (const value of data) {
                    acc = (acc << 8) | value;
                    bits += 8;
                    while (bits >= 5) {
                        bits -= 5;
                        result.push((acc >> bits) & 31);
                    }
                }
                if (bits > 0) {
                    result.push((acc << (5 - bits)) & 31);
                }

                return new Uint8Array(result);
            };

            const prefixData = new Uint8Array(customPrefix.length + 1);
            for (let i = 0; i < customPrefix.length; i++) {
                prefixData[i] = customPrefix.charCodeAt(i) & 31;
            }
            const verHash = new Uint8Array(1 + hash.length);
            verHash[0] = versionByte;
            verHash.set(hash, 1);
            const payloadData = to5Bit(verHash);
            const checksumData = new Uint8Array(prefixData.length + payloadData.length + 8);
            checksumData.set(prefixData, 0);
            checksumData.set(payloadData, prefixData.length);

            const GENERATOR = [
                0x98f2bc8e61n,
                0x79b76d99e2n,
                0xf33e5fb3c4n,
                0xae2eabe2a8n,
                0x1e4f43e470n,
            ];
            let checksum = 1n;
            for (let i = 0; i < checksumData.length; i++) {
                const value = BigInt(checksumData[i]);
                const topBits = checksum >> 35n;
                checksum = ((checksum & 0x07ffffffffn) << 5n) ^ value;
                for (let j = 0; j < GENERATOR.length; j++) {
                    if (((topBits >> BigInt(j)) & 1n) === 1n) {
                        checksum = checksum ^ GENERATOR[j];
                    }
                }
            }
            checksum = checksum ^ 1n;

            const checksumBytes = new Uint8Array(8);
            for (let i = 0; i < 8; i++) {
                checksumBytes[7 - i] = Number(checksum & 31n);
                checksum = checksum >> 5n;
            }

            const payload = new Uint8Array(payloadData.length + 8);
            payload.set(payloadData, 0);
            payload.set(checksumBytes, payloadData.length);

            const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
            let base32Str = '';
            for (const v of payload) {
                base32Str += CHARSET[v];
            }

            const customPrefixAddr = customPrefix + ':' + base32Str;
            expect(() => isCashAddress(customPrefixAddr)).toThrow('Invalid Bitcoin Cash address');
        });
    });
});
