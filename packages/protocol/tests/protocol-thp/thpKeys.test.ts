/* eslint-disable no-console */
import * as crypto from 'crypto';

import { aesgcm } from '../../src/protocol-thp/crypto/aesgcm';
import { curve25519, getCurve25519KeyPair } from '../../src/protocol-thp/crypto/curve25519';

const PROTOCOL_NAME = Buffer.from('Noise_XX_25519_AESGCM_SHA256', 'ascii');

function hmacSHA256(key: any, data: any) {
    return crypto.createHmac('sha256', key).update(data).digest();
}

function hkdf(chainingKey: any, input: any) {
    const tempKey = hmacSHA256(chainingKey, input);
    const output1 = hmacSHA256(tempKey, Buffer.from([0x01]));

    const ctxOutput2 = crypto.createHmac('sha256', tempKey).update(output1);
    ctxOutput2.update(Buffer.from([0x02]));
    const output2 = ctxOutput2.digest();

    return [output1, output2];
}

const hash_of_two = (part_1: Buffer, part_2: Buffer) => {
    const ctx = crypto.createHash('sha256').update(part_1).update(part_2);

    return ctx.digest();

    // const ctx = crypto.createHash('sha256'); //sha256(part_1)
    // ctx.update(part_2)
    // return ctx.digest()
};

// const getHashOf = (parts: Buffer[]) => {
//     let ctx: crypto.Hash = crypto.createHash('sha256');
//     const value: Buffer;
//     for (let i = 0; i < parts.length; i++) {
//         ctx = crypto.createHash('sha256');
//         value = ctx.
//     }
//     parts.forEach(part => {

//         ctx.update(part);
//     });

//     return ctx.digest();

//     // const ctx = crypto.createHash('sha256'); //sha256(part_1)
//     // ctx.update(part_2)
//     // return ctx.digest()
// };

const IV_1 = Buffer.alloc(12).fill(0);
const IV_2 = Buffer.from('000000000000000000000001', 'hex');

// trezor static privkey: 670c63187b4d556df606edce0f91adda09fb43c4998c3097a89080be0905a727
// trezor static pubkey:  ccbf529fc8dd4662d4d1d1fa66368b8758c0b6673a1bb9d532d95ca607cbf729
// trezor_static_privkey: b'670c63187b4d556df606edce0f91adda09fb43c4998c3097a89080be0905a727'
// trezor_static_pubkey: b'ccbf529fc8dd4662d4d1d1fa66368b8758c0b6673a1bb9d532d95ca607cbf729'
// trezor_ephemeral_privkey: b'a894bb9c1b08fe73be1e33220537d557a0bcab057f47ef5ed22e79600900c07d'
// trezor_ephemeral_pubkey: b'06a541a61dd683abcc90e015174a653362467f756806a8c495f1d4828a305e3d'
// host_ephemeral_pubkey: b'a4e09292b651c278b9772c569f5fa9bb13d906b46ab68c9df9dc2b4409f8a209'
// h1 b'b11d4d731ee7699c8f5e9c244734c13440ad2a80d25a2aa0f7f4b0172742e325' b'0a0454325431100018002003280228032804'
// h2 b'2bd98e1e46469ea4387396d7ce53d277b64b045fc9766bbab38df0221bcb8e5b'
// h3 b'8a57b8880ca8ee17ad8c4cff99f181f22c857775ce1e28f4bab5a36ab12429d0'
// point b'6be98c6c6803e11cda3dd7b5a99e5fe88b267fe6b8bdd0fda0318e2b8f34e926'
// CK, K b'5ec65a95f15b65298db075d6df8423c519ef3e7e17dd100b3a530062842a0b4d' b'1c2d3fc43c304b78d9db5a8aa50d9f735b3573f0df0d05b146df8d65d9c7e74c'
// key len: 32
// mask: b'1ca0e69b73a4fe076fe3deabb45a6ffdbb0d1cc789f5671b4287325db9a0485d'
// trezor_masked_static_pubkey: b'1f746015dbb4c25a8d3ccb6672b6c812157107cb1e0380f42aee6e7d706ea824'
// encrypted_trezor_static_pubkey: b'445b7ee6b1f7969bf94382ab65272aefd6e675245aa5ad754902b50c2c7d15c4'
// tag_to_encrypted_key: b'2960ac6a3f8f9ef1eacddb60a5691129'
// encrypted_trezor_static_pubkey with tag: b'445b7ee6b1f7969bf94382ab65272aefd6e675245aa5ad754902b50c2c7d15c42960ac6a3f8f9ef1eacddb60a5691129'
// h4 b'539fc4cddc323e0ce03eb4139ac980752c8fd3ad93799acb0e127f3d3210c59b' b'445b7ee6b1f7969bf94382ab65272aefd6e675245aa5ad754902b50c2c7d15c42960ac6a3f8f9ef1eacddb60a5691129'
// point2 b'02e1cc5af549c75d34302ed869314f0f1382b3382282fc49d27e3c83e1345922'
// point3 b'0ca2c33692579011097458d570ab7ec430268cfcbc3868ddfd11f9fdb55ff549'
// CK, K b'84e441d0ca103b1ce42dfe6d15d6f8d451406b3f8ee11c7d14897931f9beb33f' b'acc459092f3bb7b659a753ce3c8ed90a67aa681244b52f06b5852d263a3ae8a3'
// tag b'd0fccad927bc360756c13a1a0d09ce21'
// h5 b'6ccc7e5d8554a917c5c3afb6ab94db6152e68bbec9a59c5a9afb109f7a6ed285'
// trezor ephemeral pubkey: 06a541a61dd683abcc90e015174a653362467f756806a8c495f1d4828a305e3d
// trezor masked static pubkey: 445b7ee6b1f7969bf94382ab65272aefd6e675245aa5ad754902b50c2c7d15c42960ac6a3f8f9ef1eacddb60a5691129
// tag: b'd0fccad927bc360756c13a1a0d09ce21'

describe('keys', () => {
    // State HH1
    // https://www.notion.so/satoshilabs/Handshake-phase-1a1570ee0964418484c68117a1840819

    it.only('HH1', () => {
        const trezorKeys = {
            ephemeralPublicKey: Buffer.from(
                '06a541a61dd683abcc90e015174a653362467f756806a8c495f1d4828a305e3d',
                'hex',
            ),
            encryptedStaticPublicKey: Buffer.from(
                '445b7ee6b1f7969bf94382ab65272aefd6e675245aa5ad754902b50c2c7d15c42960ac6a3f8f9ef1eacddb60a5691129',
                'hex',
            ),
            tag: Buffer.from('d0fccad927bc360756c13a1a0d09ce21', 'hex'),
            // just for debugging
            ephemeralPrivateKey: Buffer.from(
                'a894bb9c1b08fe73be1e33220537d557a0bcab057f47ef5ed22e79600900c07d',
                'hex',
            ),
        };

        const hostStaticKeys = getCurve25519KeyPair(Buffer.alloc(32).fill(7));
        const hostEphemeralKeys = getCurve25519KeyPair(Buffer.alloc(32).fill(1));

        console.log('HOSTKEYS', hostEphemeralKeys);

        const point1a = curve25519(hostStaticKeys.privateKey, trezorKeys.ephemeralPublicKey);
        const point1b = curve25519(trezorKeys.ephemeralPrivateKey, hostStaticKeys.publicKey);
        console.warn('cross-point', point1a.toString('hex'), point1b.toString('hex'));

        let h: Buffer, point: Buffer, aesGcm: ReturnType<typeof aesgcm>;

        // 1. Set h = SHA-256(protocol_name || device_properties).
        h = hash_of_two(PROTOCOL_NAME, Buffer.from('0a0454325431100018002003280228032804', 'hex'));
        console.log('h1', h.toString('hex'));
        // 2. Set h = SHA-256(h || host_ephemeral_pubkey).
        h = hash_of_two(h, hostEphemeralKeys.publicKey);
        console.log('h2', h.toString('hex'));
        // 3. Set h = SHA-256(h || trezor_ephemeral_pubkey).
        h = hash_of_two(h, trezorKeys.ephemeralPublicKey);
        console.log('h3', h.toString('hex'));
        // 4. Set ck, k = HKDF(protocol_name, X25519(host_ephemeral_privkey, trezor_ephemeral_pubkey)).
        point = curve25519(hostEphemeralKeys.privateKey, trezorKeys.ephemeralPublicKey);
        console.warn('point1', point.toString('hex'));
        let [ck, k] = hkdf(PROTOCOL_NAME, point);
        console.log('CK, K', ck, k);

        // 5. Set trezor_masked_static_pubkey, success = AES-GCM-DECRYPT(key=k, IV=0^96 (bits, 12 bytes), ad=h, plaintext=encrypted_trezor_static_pubkey). Assert that success is True.
        aesGcm = aesgcm(k, IV_1);
        aesGcm.auth(h);
        const trezorStaticPubkey = trezorKeys.encryptedStaticPublicKey.subarray(0, 32);
        const trezorStaticPubkeyTag = trezorKeys.encryptedStaticPublicKey.subarray(32, 32 + 16);
        const trezorMaskedStaticPubkey = aesGcm.decrypt(trezorStaticPubkey, trezorStaticPubkeyTag);
        console.warn('trezorMaskedStaticPubkey', trezorMaskedStaticPubkey.toString('hex'));
        // 6. Set h = SHA-256(h || encrypted_trezor_static_pubkey)
        h = hash_of_two(h, trezorKeys.encryptedStaticPublicKey);
        console.log('h4', h.toString('hex'));
        // 7. Set ck, k = HKDF(ck, X25519(host_ephemeral_privkey, trezor_masked_static_pubkey))
        point = curve25519(hostEphemeralKeys.privateKey, trezorMaskedStaticPubkey);
        console.log('point2', point.toString('hex'));
        [ck, k] = hkdf(ck, point);
        console.log('CK, K', ck.toString('hex'), k.toString('hex'));

        // NOTE: workaround to remove
        // aesGcm = aesgcm(k, IV_1);
        // aesGcm.auth(h);
        // aesGcm.encrypt(Buffer.from('', 'ascii'));
        // const tagToEncryptedKey = aesGcm.finish(); // this works, trezorKeys.tag not working
        // console.warn(
        //     'tagToEncryptedKey',
        //     tagToEncryptedKey.toString('hex'),
        //     '!=',
        //     trezorKeys.tag.toString('hex'),
        // );

        // 8. Set tag_of_empty_string, success = AES-GCM-DECRYPT(key=k, IV=0^96 (bits, 12 bytes), ad=h, plaintext=empty_string). Assert that success is True.
        aesGcm = aesgcm(k, IV_1);
        aesGcm.auth(h);
        aesGcm.decrypt(Buffer.alloc(0), trezorKeys.tag);
        // 9. Set h = SHA-256(h || tag)
        h = hash_of_two(h, trezorKeys.tag);
        console.log('h5', h.toString('hex'));

        const hostTempKeys = getCurve25519KeyPair(Buffer.alloc(32).fill(9));
        // 11. Set encrypted_host_static_pubkey = AES-GCM-ENCRYPT(key=k, IV=0^95 || 1, ad=h, plaintext=temp_host_static_pubkey).
        aesGcm = aesgcm(k, IV_2);
        aesGcm.auth(h);
        const encryptedHostStaticPubkey = aesGcm.encrypt(hostTempKeys.publicKey);
        const encryptedHostStaticPubkeyTag = aesGcm.finish();
        console.log(
            'encryptedHostStaticPubkey',
            encryptedHostStaticPubkey.toString('hex'),
            encryptedHostStaticPubkeyTag.toString('hex'),
        );
        // 12. Set h = SHA-256(h || encrypted_host_static_pubkey).
        h = hash_of_two(
            h,
            Buffer.concat([encryptedHostStaticPubkey, encryptedHostStaticPubkeyTag]),
            // Buffer.from(
            //     '228fede347433c033e1a9000990dfcf55d637d72e68505a69fdbbcacda96c63e7ea77c131872694d40ff529fe05e41c5',
            //     'hex',
            // ),
        );
        console.log('h6', h.toString('hex'));
        // 13. Set ck, k = HKDF(ck, X25519(temp_host_static_privkey, trezor_ephemeral_pubkey)).
        point = curve25519(hostTempKeys.privateKey, trezorKeys.ephemeralPublicKey);
        console.log('point3', point.toString('hex'));
        [ck, k] = hkdf(ck, point);

        // Set encrypted_payload = AES-GCM-ENCRYPT(key=k, IV=0^96, ad=h, plaintext=payload_binary).
        aesGcm = aesgcm(k, IV_1);
        aesGcm.auth(h);
        const encryptedPayload = aesGcm.encrypt(
            // encoded protobuf
            Buffer.from('10021003', 'hex'),
        );
        const encryptedPayloadTag = aesGcm.finish();

        console.warn(
            'encryptedPayload',
            encryptedPayload.toString('hex'),
            encryptedPayloadTag.toString('hex'),
        );
    });

    it('trezor _handle_th1_crypto', () => {
        const host_ephemeral_pubkey = Buffer.from(
            'ccbf529fc8dd4662d4d1d1fa66368b8758c0b6673a1bb9d532d95ca607cbf729',
            'hex',
        );
        const trezor_static_pubkey = Buffer.from(
            'ccbf529fc8dd4662d4d1d1fa66368b8758c0b6673a1bb9d532d95ca607cbf729',
            'hex',
        );
        const trezor_static_privkey = Buffer.from(
            '670c63187b4d556df606edce0f91adda09fb43c4998c3097a89080be0905a727',
            'hex',
        );
        const trezor_ephemeral_pubkey = Buffer.from(
            '629dd9541c5d14397470c20d694d87f0728815b6eaddc6c431c8f999bb19e945',
            'hex',
        );
        const trezor_ephemeral_privkey = Buffer.from(
            '408cce89d32a733a1632f3457d42e393b821acc9b7f9935aaa8b502e01c7c551',
            'hex',
        );

        const h2 = hash_of_two(PROTOCOL_NAME, Buffer.alloc(0));
        const h3 = hash_of_two(h2, host_ephemeral_pubkey);
        const h4 = hash_of_two(h3, trezor_ephemeral_pubkey);

        const point = curve25519(trezor_ephemeral_privkey, host_ephemeral_pubkey);
        // const point = 'e78d7e173f234ffaebe0c5a38ea4f89af67fdb112ecd12e6999d60016cc41975';
        const k = hkdf(PROTOCOL_NAME, point);
        const mask = hash_of_two(trezor_static_pubkey, trezor_ephemeral_pubkey);

        console.warn('h2', h2);
        console.warn('h3', h3);
        console.warn('h4', h4);
        console.warn('point', Buffer.from(point).toString('hex'));
        console.warn('K', k);
        console.warn('Mask', mask);

        // const aesKey = Buffer.alloc(32);
        // const iv = Buffer.alloc(8);
        // const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
        // const endCText = cipher.final();

        // const IV_1 = Buffer.alloc(12);
        // const trezor_masked_static_pubkey = Buffer.from(
        //     'ccbf529fc8dd4662d4d1d1fa66368b8758c0b6673a1bb9d532d95ca607cbf729',
        //     'hex',
        // );
        const trezor_masked_static_pubkey = Buffer.from(curve25519(mask, trezor_static_pubkey));
        console.warn('trezor_masked_static_pubkey', trezor_masked_static_pubkey);

        const aes_ctx = aesgcm(k[1], IV_1);
        aes_ctx.auth(h4);
        // aes_ctx.encrypt(trezor_masked_static_pubkey);
        // aes_ctx.encrypt(Buffer.alloc(0));
        const encrypted_trezor_static_pubkey1 = aes_ctx.encrypt(trezor_masked_static_pubkey);
        // const encrypted_trezor_static_pubkey = Buffer.from(
        //     'fa0a6819e17d6af2717ad019724d5b285e2a4c6276c2a844a08e0291110571b99f51c7eb8571a4745bfa6facf732b327',
        //     'hex',
        // );

        const tag_to_encrypted_key = aes_ctx.finish();
        const encrypted_trezor_static_pubkey = Buffer.concat([
            encrypted_trezor_static_pubkey1,
            tag_to_encrypted_key,
        ]);
        console.warn('tag_to_encrypted_key', tag_to_encrypted_key);

        const h5 = hash_of_two(h4, encrypted_trezor_static_pubkey);
        console.warn('h5', h5, encrypted_trezor_static_pubkey.toString('hex'));

        const point2 = Buffer.from(curve25519(trezor_static_privkey, host_ephemeral_pubkey));
        console.warn('point2', point2);

        const k2 = hkdf(k[0], curve25519(mask, point2));
        console.warn('k2', k2);

        // aes_ctx.reset(IV_1);
        aes_ctx.auth(h5);
        aes_ctx.encrypt(Buffer.alloc(0));
        const tag = aes_ctx.finish();
        console.warn('tag', tag);
        const h6 = hash_of_two(h5, tag);
        console.warn('h6', h6);

        // const aes_ctx2 = aesgcm(k[1], IV_1);
        // // const dec = aes_ctx2.decrypt(encrypted_trezor_static_pubkey, h6, tag);
        // // console.warn('DECR', dec);

        // const decryptedData = aes_ctx2.decrypt(
        //     encrypted_trezor_static_pubkey,
        //     h4,
        //     tag_to_encrypted_key,
        // );
        // console.log('Decrypted Data:', decryptedData.toString('hex'));

        expect(tag.toString('hex')).toEqual('370c514b75b6d1abc9c7dfb368d7c718');
    });
});
