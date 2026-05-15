import * as bs58check from '../src/bs58check';

describe('bs58check', () => {
    it('encode defaults to bitcoin network when no network arg is provided', () => {
        // Standard bitcoin P2PKH payload: version byte 0x00 + RIPEMD160(SHA256(pubkey))
        // for the public key whose hash is 751e76e8199196d454941c45d1b3a323f1433bd6
        // (the canonical bitcoinjs-lib test vector for address 1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH).
        const payload = Buffer.from('00751e76e8199196d454941c45d1b3a323f1433bd6', 'hex');

        const encoded = bs58check.encode(payload);
        expect(encoded).toBe('1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH');
    });
});
