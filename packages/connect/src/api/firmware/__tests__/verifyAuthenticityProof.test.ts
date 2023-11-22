import { verifyAuthenticityProof } from '../verifyAuthenticityProof';
import { fixSignature } from '../x509certificate';

const CA_CERT =
    '308201df30820184a00302010202040a001ab3300a06082a8648ce3d0403023054310b300906035504061302435a311e301c060355040a0c155472657a6f7220436f6d70616e7920732e722e6f2e3125302306035504030c1c5472657a6f72204d616e75666163747572696e6720526f6f742043413020170d3233303130313030303030305a180f32303533303130313030303030305a304f310b300906035504061302435a311e301c060355040a0c155472657a6f7220436f6d70616e7920732e722e6f2e3120301e06035504030c175472657a6f72204d616e75666163747572696e672043413059301306072a8648ce3d020106082a8648ce3d030107034200041b36cc98d5e3d1a20677aaf26254ef3756f27c9d63080c93ad3e7d39d3ad23bf00497b924789bc8e3f87834994e16780ad4eae7e75db1f03835ca64363e980b4a3473045300e0603551d0f0101ff04040302020430120603551d130101ff040830060101ff020100301f0603551d2304183016801428b202f8f9c78a74e8c152bbfb433d99d0ca03ef300a06082a8648ce3d0403020349003046022100dfe2f837f3644c1f0250d37cd0f7d1e4e9b8cfc4820d7f5a623a8cb69df99f6c02210089148848c5fc597df4b8545d9b19d1cc15abe0e1252fa2938a4cf01ae835c563';
const DEVICE_CERT =
    '3082019e30820145a00302010202044ee2a50f300a06082a8648ce3d040302304f310b300906035504061302435a311e301c060355040a0c155472657a6f7220436f6d70616e7920732e722e6f2e3120301e06035504030c175472657a6f72204d616e75666163747572696e67204341301e170d3232303433303134313630315a170d3432303433303134313630315a301d311b301906035504030c1254324231205472657a6f72205361666520333059301306072a8648ce3d020106082a8648ce3d030107034200049bbf06dad9ab5905e05471ce16d5222c89c2caa39f26267ac0747129885fbd441bcc7fa84de120a36755daf30a6f47e8c0d4bddc15036ed2a3447dfa7a1d3e88a341303f300e0603551d0f0101ff040403020080300c0603551d130101ff04023000301f0603551d23041830168014176d8b9a403574f6a2b9ac353ef578682201a21a300a06082a8648ce3d04030203470030440220747c545e112df816173d3071f1ab25d399d8108550764ce1a3a428f1f18b506902200cda822c75b3da6e44e098014452f3fc324f29a79204c3fb4d5815afafc04b17';
const SIGNATURE =
    '3045022100c01793ffbe4f16d4efc84a4533d9bbfbbf1baa5349346678e07fdb6d848cca7902200df11b9d2850173d9c93993fca983c6d2a3f31ea69a0e19b69e18cc3b78424fe';
const CHALLENGE = '29d0be0f3cb191c80d108359c64d22984a77ad8b99433814be31db0b6e9e7920';
const CONFIG = {
    version: 1,
    timestamp: '2023-09-07T14:00:00+00:00',
    T2B1: {
        rootPubKeys: [
            '04626d58aca84f0fcb52ea63f0eb08de1067b8d406574a715d5e7928f4b67f113a00fb5c5918e74d2327311946c446b242c20fe7347482999bdc1e229b94e27d96',
        ],
        caPubKeys: [
            '041b36cc98d5e3d1a20677aaf26254ef3756f27c9d63080c93ad3e7d39d3ad23bf00497b924789bc8e3f87834994e16780ad4eae7e75db1f03835ca64363e980b4',
        ],
    },
};

describe('firmware/verifyAuthenticityProof', () => {
    it('verify success (with prod keys)', async () => {
        const verify = await verifyAuthenticityProof({
            certificates: [DEVICE_CERT, CA_CERT],
            signature: SIGNATURE,
            challenge: Buffer.from(CHALLENGE, 'hex'),
            deviceModel: 'T2B1',
            config: CONFIG,
        });

        expect(verify.valid).toBe(true);
        expect(verify.debugKey).toBe(undefined);
        expect(verify.caPubKey).toEqual(expect.any(String));
    });

    it('verify success (with debug keys)', async () => {
        const verify = await verifyAuthenticityProof({
            certificates: [DEVICE_CERT, CA_CERT],
            signature: SIGNATURE,
            challenge: Buffer.from(CHALLENGE, 'hex'),
            deviceModel: 'T2B1',
            config: {
                ...CONFIG,
                T2B1: {
                    rootPubKeys: [],
                    caPubKeys: [],
                    debug: {
                        rootPubKeys: CONFIG.T2B1.rootPubKeys,
                        caPubKeys: CONFIG.T2B1.caPubKeys,
                    },
                },
            },
            allowDebugKeys: true,
        });

        expect(verify.valid).toBe(true);
        expect(verify.debugKey).toBe(true);
        expect(verify.caPubKey).toEqual(expect.any(String));
    });

    it('verify failed (signature missmatch)', async () => {
        const verify = await verifyAuthenticityProof({
            certificates: [DEVICE_CERT, CA_CERT],
            signature:
                // invalid 2nd byte of signature
                '3044022100c01793ffbe4f16d4efc84a4533d9bbfbbf1baa5349346678e07fdb6d848cca7902200df11b9d2850173d9c93993fca983c6d2a3f31ea69a0e19b69e18cc3b78424fe',
            challenge: Buffer.from(CHALLENGE, 'hex'),
            deviceModel: 'T2B1',
            config: CONFIG,
        });

        expect(verify.valid).toBe(false);
        expect(verify.error).toBe('INVALID_DEVICE_SIGNATURE');
    });

    it('verify failed (missing rootPubKey)', async () => {
        const verify = await verifyAuthenticityProof({
            certificates: [DEVICE_CERT, CA_CERT],
            signature: SIGNATURE,
            challenge: Buffer.from(CHALLENGE, 'hex'),
            deviceModel: 'T2B1',
            config: {
                ...CONFIG,
                T2B1: {
                    ...CONFIG.T2B1,
                    rootPubKeys: [
                        // invalid root pub key
                        '0423a5c9ec44dfb96023838d958f6289fa611277ee7af60c3bcb54eff2310546d5ece48b1a507503142b122b53eda53fef3f3d3510f3b7ae2fd5f13614b025ede1',
                    ],
                },
            },
        });

        expect(verify.valid).toBe(false);
        expect(verify.configExpired).toBe(false);
        expect(verify.error).toBe('ROOT_PUBKEY_NOT_FOUND');
    });

    it('verify failed (outdated config, missing rootPubKey)', async () => {
        const verify = await verifyAuthenticityProof({
            certificates: [DEVICE_CERT, CA_CERT],
            signature: SIGNATURE,
            challenge: Buffer.from(CHALLENGE, 'hex'),
            deviceModel: 'T2B1',
            config: {
                ...CONFIG,
                // old timestamp
                timestamp: '2000-09-07T14:00:00+00:00',
                T2B1: {
                    ...CONFIG.T2B1,
                    rootPubKeys: [
                        // invalid root pub key
                        '0423a5c9ec44dfb96023838d958f6289fa611277ee7af60c3bcb54eff2310546d5ece48b1a507503142b122b53eda53fef3f3d3510f3b7ae2fd5f13614b025ede1',
                    ],
                },
            },
        });

        expect(verify.valid).toBe(false);
        expect(verify.configExpired).toBe(true);
        expect(verify.error).toBe('ROOT_PUBKEY_NOT_FOUND');
    });

    it('verify failed (device model mismatch)', async () => {
        const verify = await verifyAuthenticityProof({
            certificates: [
                '3082019e30820145a00302010202044ee2a50f300a06082a8648ce3d040302304f310b300906035504061302435a311e301c060355040a0c155472657a6f7220436f6d70616e7920732e722e6f2e3120301e06035504030c175472657a6f72204d616e75666163747572696e67204341301e170d3232303433303134313630315a170d3432303433303134313630315a301d311b301906035504030c1254324232205472657a6f72205361666520333059301306072a8648ce3d020106082a8648ce3d030107034200049bbf06dad9ab5905e05471ce16d5222c89c2caa39f26267ac0747129885fbd441bcc7fa84de120a36755daf30a6f47e8c0d4bddc15036ed2a3447dfa7a1d3e88a341303f300e0603551d0f0101ff040403020080300c0603551d130101ff04023000301f0603551d23041830168014176d8b9a403574f6a2b9ac353ef578682201a21a300a06082a8648ce3d04030203470030440220747c545e112df816173d3071f1ab25d399d8108550764ce1a3a428f1f18b506902200cda822c75b3da6e44e098014452f3fc324f29a79204c3fb4d5815afafc04b17',
                CA_CERT,
            ],
            signature: SIGNATURE,
            challenge: Buffer.from(CHALLENGE, 'hex'),
            deviceModel: 'T2B1',
            config: CONFIG,
        });

        expect(verify.valid).toBe(false);
        expect(verify.error).toBe('INVALID_DEVICE_MODEL');
    });

    it('verify failed (missing caPubKey)', async () => {
        const verify = await verifyAuthenticityProof({
            certificates: [DEVICE_CERT, CA_CERT],
            signature: SIGNATURE,
            challenge: Buffer.from(CHALLENGE, 'hex'),
            deviceModel: 'T2B1',
            config: {
                ...CONFIG,
                T2B1: {
                    ...CONFIG.T2B1,
                    caPubKeys: [],
                },
            },
        });

        expect(verify.valid).toBe(false);
        expect(verify.configExpired).toBe(false);
        expect(verify.error).toBe('CA_PUBKEY_NOT_FOUND');
    });

    it('verify failed (outdated config, missing caPubKey)', async () => {
        const verify = await verifyAuthenticityProof({
            certificates: [DEVICE_CERT, CA_CERT],
            signature: SIGNATURE,
            challenge: Buffer.from(CHALLENGE, 'hex'),
            deviceModel: 'T2B1',
            config: {
                ...CONFIG,
                // old timestamp
                timestamp: '2000-09-07T14:00:00+00:00',
                T2B1: {
                    ...CONFIG.T2B1,
                    caPubKeys: [],
                },
            },
        });

        expect(verify.valid).toBe(false);
        expect(verify.configExpired).toBe(true);
        expect(verify.error).toBe('CA_PUBKEY_NOT_FOUND');
    });
});

// Optiga may produce a malformed signature with probability 1 in 256.
// These test vectors verify that we are able to correctly reencode the malfomed signature into a valid DER encoding.
describe('firmware/x509certificate', () => {
    [
        {
            signature:
                '3048022200007f0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f02220000800102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
            result: '304502207f0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f022100800102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
        },
        {
            signature:
                '3045022100007f0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e0220800102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
            result: '3044021f7f0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e022100800102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f',
        },
        {
            signature:
                '30330220007f0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e020f000000000000008001020304050607',
            result: '302c021f7f0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e0209008001020304050607',
        },
        {
            signature:
                '303402210000800102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e020f000000000000007f01020304050607',
            result: '302c022000800102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e02087f01020304050607',
        },
        {
            signature:
                '30440221007f0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f021f800102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e',
            result: '304402207f0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f022000800102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e',
        },
    ].forEach(f => {
        it(`fixSignature: ${f.signature.length} to ${f.result.length}`, () => {
            const signature = fixSignature(new Uint8Array(Buffer.from(f.signature, 'hex')));
            expect(Buffer.from(signature).toString('hex')).toEqual(f.result);
        });
    });
});
