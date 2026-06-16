import { sha256, sha256Checksum, sha256x2 } from '../utils';

// These functions were re-implemented on top of @noble/hashes (issue #27403,
// replacing the unmaintained jssha dependency). The behaviour must stay
// byte-identical, so we pin it against published known-answer vectors.
//
// Inputs and outputs are hex strings; "abc" is the byte sequence 0x61 0x62 0x63.
describe('crypto/utils sha256 helpers', () => {
    describe('sha256', () => {
        // NIST "SHA-256 Examples" — one-block message "abc", page 1
        // ("Message Digest is BA7816BF 8F01CFEA ... F20015AD"):
        // https://csrc.nist.gov/CSRC/media/Projects/Cryptographic-Standards-and-Guidelines/documents/examples/SHA256.pdf
        it('matches the NIST "abc" example vector', () => {
            expect(sha256('616263')).toEqual(
                'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
            );
        });

        // NIST CAVP byte-oriented test vectors, SHA256ShortMsg.rsp entry "Len = 0":
        // https://csrc.nist.gov/CSRC/media/Projects/Cryptographic-Algorithm-Validation-Program/documents/shs/shabytetestvectors.zip
        it('matches the NIST CAVP empty-message vector', () => {
            expect(sha256('')).toEqual(
                'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            );
        });
    });

    describe('sha256x2', () => {
        // Double SHA-256 (Bitcoin "hash256") of the same FIPS "abc" input:
        // SHA-256(SHA-256(0x616263)). Cross-checked against Node's crypto module.
        it('is SHA-256 applied twice', () => {
            expect(sha256x2('616263')).toEqual(
                '4f8b42c22dd3729b519ba6f68d2da7cc5b2d606d05daed5ad5128cc03e6c6358',
            );
            expect(sha256x2('616263')).toEqual(sha256(sha256('616263')));
        });
    });

    describe('sha256Checksum', () => {
        // base58check checksum = first 4 bytes (8 hex chars) of the double SHA-256.
        it('is the first 4 bytes of sha256x2', () => {
            expect(sha256Checksum('616263')).toEqual('4f8b42c2');
            expect(sha256Checksum('616263')).toEqual(sha256x2('616263').slice(0, 8));
        });
    });
});
