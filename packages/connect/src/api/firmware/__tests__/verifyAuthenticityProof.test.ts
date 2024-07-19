import { DeviceAuthenticityConfig } from '../../../data/deviceAuthenticityConfigTypes';
import { verifyAuthenticityProof } from '../verifyAuthenticityProof';
import { fixSignature, parseCertificate } from '../x509certificate';

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
    T3T1: {
        rootPubKeys: [
            '04626d58aca84f0fcb52ea63f0eb08de1067b8d406574a715d5e7928f4b67f113a00fb5c5918e74d2327311946c446b242c20fe7347482999bdc1e229b94e27d96',
        ],
        caPubKeys: [
            '041b36cc98d5e3d1a20677aaf26254ef3756f27c9d63080c93ad3e7d39d3ad23bf00497b924789bc8e3f87834994e16780ad4eae7e75db1f03835ca64363e980b4',
        ],
    },
} as DeviceAuthenticityConfig;

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

describe('firmware/x509certificate extensions', () => {
    it('value with length = 128 (0x80)', () => {
        const ca = Buffer.from(
            '308202F330820299A0030201020214516DA7660199929ACE0FB6B34490BA5AEE8F8B5C300A06082A8648CE3D0403023054310B300906035504061302435A311E301C060355040A0C155472657A6F7220436F6D70616E7920732E722E6F2E3125302306035504030C1C5472657A6F72204D616E75666163747572696E6720526F6F74204341301E170D3234303731363131333730345A170D3234303831353131333730345A3081DD310B300906035504061302435A311E301C060355040A0C155472657A6F7220436F6D70616E7920732E722E6F2E3120301E06035504030C175472657A6F72204D616E75666163747572696E6720434131818B30818806035504080C81807A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A7A3059301306072A8648CE3D020106082A8648CE3D03010703420004E4B0A10EBEB3FC67DF9F22441C3BE991C37A37FFA306C458FEB9CB4C651B8EFED4D7D081A4AD82328B686A710B96409B4B84AA234B4BA0AB8355308A51C232C0A381BE3081BB300F0603551D13040830060101FF020100300E0603551D0F0101FF040403020204301D0603551D0E04160414ADCE81F32C769B4A04217AC0FB11DC6F4C0E34FD30790603551D2304723070A158A4563054310B300906035504061302435A311E301C060355040A0C155472657A6F7220436F6D70616E7920732E722E6F2E3125302306035504030C1C5472657A6F72204D616E75666163747572696E6720526F6F742043418214166FE982F3E81D1300E221267CC920ECE15E903F300A06082A8648CE3D0403020348003045022009DA051A5CA48818C7605560E525B6C319211885B85FB0E3E287DF637239E486022100FAAE61D20C937B7443184F02D0389B4F6499A2743F4D2B118CBC2A25E1942F04',
            'hex',
        );
        const cert = parseCertificate(ca);
        const stateOrProvice = cert.tbsCertificate.subject[3];
        expect(stateOrProvice.algorithm).toBe('2.5.4.8');
        expect(stateOrProvice.parameters?.asn1.contents.toString()).toEqual('z'.repeat(128));
    });

    it('critical = false', () => {
        const ca = Buffer.from(
            '308202663082020DA003020102021414B2FC95484879B3F005514102D2FEE49C82F77F300A06082A8648CE3D0403023054310B300906035504061302435A311E301C060355040A0C155472657A6F7220436F6D70616E7920732E722E6F2E3125302306035504030C1C5472657A6F72204D616E75666163747572696E6720526F6F74204341301E170D3234303731353133353931375A170D3234303831343133353931375A304F310B300906035504061302435A311E301C060355040A0C155472657A6F7220436F6D70616E7920732E722E6F2E3120301E06035504030C175472657A6F72204D616E75666163747572696E672043413059301306072A8648CE3D020106082A8648CE3D03010703420004E4B0A10EBEB3FC67DF9F22441C3BE991C37A37FFA306C458FEB9CB4C651B8EFED4D7D081A4AD82328B686A710B96409B4B84AA234B4BA0AB8355308A51C232C0A381C13081BE30120603551D13010100040830060101FF020100300E0603551D0F0101FF040403020204301D0603551D0E04160414ADCE81F32C769B4A04217AC0FB11DC6F4C0E34FD30790603551D2304723070A158A4563054310B300906035504061302435A311E301C060355040A0C155472657A6F7220436F6D70616E7920732E722E6F2E3125302306035504030C1C5472657A6F72204D616E75666163747572696E6720526F6F742043418214166FE982F3E81D1300E221267CC920ECE15E903F300A06082A8648CE3D040302034700304402202548C54062260616D6F7186BBE798AB0A122A4795038224C5AF47BCC8E477891022001F93AA3EA312F05BE74BBBBCF43E3657DB025EDD6DE2EABE653242734B36FF4',
            'hex',
        );
        const cert = parseCertificate(ca);
        expect(cert.tbsCertificate.extensions.length).toBe(4);
        expect(cert.tbsCertificate.extensions[0]).toEqual({
            key: 'basicConstraints',
            critical: false,
            cA: true,
            pathLenConstraint: 0,
        });
        expect(cert.tbsCertificate.extensions[1]).toEqual({
            key: 'keyUsage',
            critical: true,
            keyCertSign: '1',
        });
    });

    it('cA and pathLenConstraint omitted', () => {
        const ca = Buffer.from(
            '3082026030820207a003020102021414b2fc95484879b3f005514102d2fee49c82f77f300a06082a8648ce3d0403023054310b300906035504061302435a311e301c060355040a0c155472657a6f7220436f6d70616e7920732e722e6f2e3125302306035504030c1c5472657a6f72204d616e75666163747572696e6720526f6f74204341301e170d3234303731353133353931375a170d3234303831343133353931375a304f310b300906035504061302435a311e301c060355040a0c155472657a6f7220436f6d70616e7920732e722e6f2e3120301e06035504030c175472657a6f72204d616e75666163747572696e672043413059301306072a8648ce3d020106082a8648ce3d03010703420004e4b0a10ebeb3fc67df9f22441c3be991c37a37ffa306c458feb9cb4c651b8efed4d7d081a4ad82328b686a710b96409b4b84aa234b4ba0ab8355308a51c232c0a381bb3081b8300c0603551d130101ff04023000300e0603551d0f0101ff040403020204301d0603551d0e04160414adce81f32c769b4a04217ac0fb11dc6f4c0e34fd30790603551d2304723070a158a4563054310b300906035504061302435a311e301c060355040a0c155472657a6f7220436f6d70616e7920732e722e6f2e3125302306035504030c1c5472657a6f72204d616e75666163747572696e6720526f6f742043418214166fe982f3e81d1300e221267cc920ece15e903f300a06082a8648ce3d040302034700304402202548c54062260616d6f7186bbe798ab0a122a4795038224c5af47bcc8e477891022001f93aa3ea312f05be74bbbbcf43e3657db025edd6de2eabe653242734b36ff4',
            'hex',
        );
        const cert = parseCertificate(ca);
        expect(cert.tbsCertificate.extensions.length).toBe(4);
        expect(cert.tbsCertificate.extensions[0]).toEqual({
            key: 'basicConstraints',
            critical: true,
            cA: false,
            pathLenConstraint: undefined,
        });
        expect(cert.tbsCertificate.extensions[1]).toEqual({
            key: 'keyUsage',
            critical: true,
            keyCertSign: '1',
        });
    });

    it('normal', () => {
        const ca = Buffer.from(
            '308202663082020DA003020102021414B2FC95484879B3F005514102D2FEE49C82F77F300A06082A8648CE3D0403023054310B300906035504061302435A311E301C060355040A0C155472657A6F7220436F6D70616E7920732E722E6F2E3125302306035504030C1C5472657A6F72204D616E75666163747572696E6720526F6F74204341301E170D3234303731353133353931375A170D3234303831343133353931375A304F310B300906035504061302435A311E301C060355040A0C155472657A6F7220436F6D70616E7920732E722E6F2E3120301E06035504030C175472657A6F72204D616E75666163747572696E672043413059301306072A8648CE3D020106082A8648CE3D03010703420004E4B0A10EBEB3FC67DF9F22441C3BE991C37A37FFA306C458FEB9CB4C651B8EFED4D7D081A4AD82328B686A710B96409B4B84AA234B4BA0AB8355308A51C232C0A381C13081BE30120603551D130101FF040830060101FF020100300E0603551D0F0101FF040403020204301D0603551D0E04160414ADCE81F32C769B4A04217AC0FB11DC6F4C0E34FD30790603551D2304723070A158A4563054310B300906035504061302435A311E301C060355040A0C155472657A6F7220436F6D70616E7920732E722E6F2E3125302306035504030C1C5472657A6F72204D616E75666163747572696E6720526F6F742043418214166FE982F3E81D1300E221267CC920ECE15E903F300A06082A8648CE3D040302034700304402202548C54062260616D6F7186BBE798AB0A122A4795038224C5AF47BCC8E477891022001F93AA3EA312F05BE74BBBBCF43E3657DB025EDD6DE2EABE653242734B36FF4',
            'hex',
        );
        const cert = parseCertificate(ca);
        expect(cert.tbsCertificate.extensions.length).toBe(4);
        expect(cert.tbsCertificate.extensions[0]).toEqual({
            key: 'basicConstraints',
            critical: true,
            cA: true,
            pathLenConstraint: 0,
        });
        expect(cert.tbsCertificate.extensions[1]).toEqual({
            key: 'keyUsage',
            critical: true,
            keyCertSign: '1',
        });
    });

    it('pathLenConstraint omitted', () => {
        const ca = Buffer.from(
            '308202643082020AA0030201020214743BF8F32C4A0A99589750E1B2219D8D83BC8348300A06082A8648CE3D0403023054310B300906035504061302435A311E301C060355040A0C155472657A6F7220436F6D70616E7920732E722E6F2E3125302306035504030C1C5472657A6F72204D616E75666163747572696E6720526F6F74204341301E170D3234303731353134303331375A170D3234303831343134303331375A304F310B300906035504061302435A311E301C060355040A0C155472657A6F7220436F6D70616E7920732E722E6F2E3120301E06035504030C175472657A6F72204D616E75666163747572696E672043413059301306072A8648CE3D020106082A8648CE3D03010703420004E4B0A10EBEB3FC67DF9F22441C3BE991C37A37FFA306C458FEB9CB4C651B8EFED4D7D081A4AD82328B686A710B96409B4B84AA234B4BA0AB8355308A51C232C0A381BE3081BB300F0603551D130101FF040530030101FF300E0603551D0F0101FF040403020204301D0603551D0E04160414ADCE81F32C769B4A04217AC0FB11DC6F4C0E34FD30790603551D2304723070A158A4563054310B300906035504061302435A311E301C060355040A0C155472657A6F7220436F6D70616E7920732E722E6F2E3125302306035504030C1C5472657A6F72204D616E75666163747572696E6720526F6F742043418214166FE982F3E81D1300E221267CC920ECE15E903F300A06082A8648CE3D0403020348003045022079BADFA9FBCAF89D19BEA66407F9EEB20A5641B79AA4B4B5CFD0A5B7125E17B4022100842825682C9855BBF400F4C44D415760F777418922CDF9FECD84EA903F010860',
            'hex',
        );
        const cert = parseCertificate(ca);
        expect(cert.tbsCertificate.extensions.length).toBe(4);
        expect(cert.tbsCertificate.extensions[0]).toEqual({
            key: 'basicConstraints',
            critical: true,
            cA: true,
        });
        expect(cert.tbsCertificate.extensions[1]).toEqual({
            key: 'keyUsage',
            critical: true,
            keyCertSign: '1',
        });
    });

    it('cA omitted', () => {
        const ca = Buffer.from(
            '308202633082020AA00302010202147AFBEEDEB17A93226F0BFA1AFF4E81648E45871C300A06082A8648CE3D0403023054310B300906035504061302435A311E301C060355040A0C155472657A6F7220436F6D70616E7920732E722E6F2E3125302306035504030C1C5472657A6F72204D616E75666163747572696E6720526F6F74204341301E170D3234303731353134303631335A170D3234303831343134303631335A304F310B300906035504061302435A311E301C060355040A0C155472657A6F7220436F6D70616E7920732E722E6F2E3120301E06035504030C175472657A6F72204D616E75666163747572696E672043413059301306072A8648CE3D020106082A8648CE3D03010703420004E4B0A10EBEB3FC67DF9F22441C3BE991C37A37FFA306C458FEB9CB4C651B8EFED4D7D081A4AD82328B686A710B96409B4B84AA234B4BA0AB8355308A51C232C0A381BE3081BB300F0603551D130101FF04053003020100300E0603551D0F0101FF040403020204301D0603551D0E04160414ADCE81F32C769B4A04217AC0FB11DC6F4C0E34FD30790603551D2304723070A158A4563054310B300906035504061302435A311E301C060355040A0C155472657A6F7220436F6D70616E7920732E722E6F2E3125302306035504030C1C5472657A6F72204D616E75666163747572696E6720526F6F742043418214166FE982F3E81D1300E221267CC920ECE15E903F300A06082A8648CE3D04030203470030440220381B80C8A44BE23333323621913CEE8ECC3890FBA63C6274EA043F43A5D8F6DA02201C0D35C050FCC7E949D9B95F390B50C98F7850F4C7A92D5894DFBBD0D65C2B24',
            'hex',
        );
        const cert = parseCertificate(ca);
        expect(cert.tbsCertificate.extensions.length).toBe(4);
        expect(cert.tbsCertificate.extensions[0]).toEqual({
            key: 'basicConstraints',
            critical: true,
            cA: false,
            pathLenConstraint: 0,
        });
        expect(cert.tbsCertificate.extensions[1]).toEqual({
            key: 'keyUsage',
            critical: true,
            keyCertSign: '1',
        });
    });

    it('keyCertSign = 0', () => {
        const ca = Buffer.from(
            '308202683082020EA0030201020214529DCCA686CB0E1E4789ADC32B7E103EC2796F84300A06082A8648CE3D0403023054310B300906035504061302435A311E301C060355040A0C155472657A6F7220436F6D70616E7920732E722E6F2E3125302306035504030C1C5472657A6F72204D616E75666163747572696E6720526F6F74204341301E170D3234303731353134313230395A170D3234303831343134313230395A304F310B300906035504061302435A311E301C060355040A0C155472657A6F7220436F6D70616E7920732E722E6F2E3120301E06035504030C175472657A6F72204D616E75666163747572696E672043413059301306072A8648CE3D020106082A8648CE3D03010703420004E4B0A10EBEB3FC67DF9F22441C3BE991C37A37FFA306C458FEB9CB4C651B8EFED4D7D081A4AD82328B686A710B96409B4B84AA234B4BA0AB8355308A51C232C0A381C23081BF30120603551D130101FF040830060101FF020100300F0603551D0F0101FF0405030307FB80301D0603551D0E04160414ADCE81F32C769B4A04217AC0FB11DC6F4C0E34FD30790603551D2304723070A158A4563054310B300906035504061302435A311E301C060355040A0C155472657A6F7220436F6D70616E7920732E722E6F2E3125302306035504030C1C5472657A6F72204D616E75666163747572696E6720526F6F742043418214166FE982F3E81D1300E221267CC920ECE15E903F300A06082A8648CE3D040302034800304502205360A1BD286A2C2A7E26F1BE23713F12A3A32AD9E8DD5BE45382CEE422E6A57C022100B258B5BEF7B9287D8EA74C97D42719B0E6EFC3C94EE3B3F01B3B40D5894B1DAD',
            'hex',
        );
        const cert = parseCertificate(ca);
        expect(cert.tbsCertificate.extensions.length).toBe(4);
        expect(cert.tbsCertificate.extensions[0]).toEqual({
            key: 'basicConstraints',
            critical: true,
            cA: true,
            pathLenConstraint: 0,
        });
        expect(cert.tbsCertificate.extensions[1]).toEqual({
            key: 'keyUsage',
            critical: true,
            keyCertSign: '0',
        });
    });

    it('critical omitted', () => {
        const ca = Buffer.from(
            '308202643082020AA003020102021401E24FF9F21E67F25800FDC3195F4B8B1994F68C300A06082A8648CE3D0403023054310B300906035504061302435A311E301C060355040A0C155472657A6F7220436F6D70616E7920732E722E6F2E3125302306035504030C1C5472657A6F72204D616E75666163747572696E6720526F6F74204341301E170D3234303731353134313633335A170D3234303831343134313633335A304F310B300906035504061302435A311E301C060355040A0C155472657A6F7220436F6D70616E7920732E722E6F2E3120301E06035504030C175472657A6F72204D616E75666163747572696E672043413059301306072A8648CE3D020106082A8648CE3D03010703420004E4B0A10EBEB3FC67DF9F22441C3BE991C37A37FFA306C458FEB9CB4C651B8EFED4D7D081A4AD82328B686A710B96409B4B84AA234B4BA0AB8355308A51C232C0A381BE3081BB300F0603551D13040830060101FF020100300E0603551D0F0101FF040403020204301D0603551D0E04160414ADCE81F32C769B4A04217AC0FB11DC6F4C0E34FD30790603551D2304723070A158A4563054310B300906035504061302435A311E301C060355040A0C155472657A6F7220436F6D70616E7920732E722E6F2E3125302306035504030C1C5472657A6F72204D616E75666163747572696E6720526F6F742043418214166FE982F3E81D1300E221267CC920ECE15E903F300A06082A8648CE3D0403020348003045022100E3AF0C6199ED3115F712AC157A7EABB31FD80F7FB77F109F0EBC1A66A59A9B8202205C3A413EBEC71B89AEEB401C112BC1C264D14C116CD7C20F2CD3C0EEEB967EEF',
            'hex',
        );
        const cert = parseCertificate(ca);
        expect(cert.tbsCertificate.extensions.length).toBe(4);
        expect(cert.tbsCertificate.extensions[0]).toEqual({
            key: 'basicConstraints',
            critical: false,
            cA: true,
            pathLenConstraint: 0,
        });
        expect(cert.tbsCertificate.extensions[1]).toEqual({
            key: 'keyUsage',
            critical: true,
            keyCertSign: '1',
        });
    });
});
