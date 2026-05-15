import * as bs58check from '../src/bs58check';
import { bitcoincash } from '../src/networks';

describe('bs58check', () => {
    it('encode defaults to bitcoin network when no network arg is provided', () => {
        // Standard bitcoin P2PKH payload: version byte 0x00 + RIPEMD160(SHA256(pubkey))
        // for the public key whose hash is 751e76e8199196d454941c45d1b3a323f1433bd6
        // (the canonical bitcoinjs-lib test vector for address 1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH).
        const payload = Buffer.from('00751e76e8199196d454941c45d1b3a323f1433bd6', 'hex');

        const encoded = bs58check.encode(payload);
        expect(encoded).toBe('1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH');
    });

    it('encodeAddress defaults to bitcoin network when no network arg is provided', () => {
        // P2PKH single-byte version (0x00) + canonical bitcoinjs-lib hash160
        // for address 1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH.
        const hash = Buffer.from('751e76e8199196d454941c45d1b3a323f1433bd6', 'hex');

        const address = bs58check.encodeAddress(hash, 0x00);
        expect(address).toBe('1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH');
    });

    it('decodeAddress throws when given a legacy (non-cashaddr) address on the bitcoinCash network', () => {
        // A canonical bitcoincash legacy P2PKH address (decodes as format=legacy, so
        // isCashAddress returns false). Passing this with the bitcoincash network
        // exercises the !isCashAddress truthy arm at bs58check.ts:64.
        const legacyBchAddress = '1BpEi6DfDAUFd7GtittLSdBeYJvcoaVggu';

        expect(() => bs58check.decodeAddress(legacyBchAddress, bitcoincash)).toThrow(
            `${legacyBchAddress} is not a cash address`,
        );
    });
});
