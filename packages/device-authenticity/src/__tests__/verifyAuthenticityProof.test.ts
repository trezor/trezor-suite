import { bufferUtils } from '@trezor/utils';

import {
    BLACKLIST_CONFIG,
    CA_CERT_OPTIGA,
    CONFIG,
    CONFIG_WITH_DEBUG_KEYS,
    DEVICE_CERT_OPTIGA,
    SIGNATURE_MCU,
    SIGNATURE_OPTIGA,
    SIGNATURE_OPTIGA_EVOLU,
    SIGNATURE_TROPIC,
    T2B1rootPubKeyOptiga,
    T3W1rootPubKeyMLDSA,
    T3W1rootPubKeyTropic,
    defaultMCUProps,
    defaultOptigaProps,
    defaultTropicProps,
} from '../../mocks/mockDeviceAuthenticityData';
import {
    matchRootPubKeyToCertificate,
    prepareDeviceAuthenticityData,
    verifyAuthenticityProof,
} from '../verifyAuthenticityProof';
import { parseCertificate } from '../x509certificate';

// TODO rewrite tests its with a fixtures object to deduplicate & to test the atomic functions with the same data.
describe(`firmware/${verifyAuthenticityProof.name}`, () => {
    it('succeeds for optiga (with prod keys)', async () => {
        const verify = await verifyAuthenticityProof(defaultOptigaProps);
        expect(verify.valid).toBe(true);
        expect(verify.caPubKey).toEqual(expect.any(String));
        expect(verify.rootPubKey).toBe(T2B1rootPubKeyOptiga);
    });

    it('succeeds for tropic (with prod keys)', async () => {
        const verify = await verifyAuthenticityProof(defaultTropicProps);
        expect(verify.valid).toBe(true);
        expect(verify.caPubKey).toEqual(expect.any(String));
        expect(verify.rootPubKey).toBe(T3W1rootPubKeyTropic);
    });

    it('succeeds for MCU (with prod keys)', async () => {
        const verify = await verifyAuthenticityProof(defaultMCUProps);
        expect(verify.valid).toBe(true);
        expect(verify.rootPubKey).toBe(T3W1rootPubKeyMLDSA);
    });

    it('succeeds for optiga (with debug keys)', async () => {
        const verify = await verifyAuthenticityProof({
            ...defaultOptigaProps,
            config: CONFIG_WITH_DEBUG_KEYS,
            allowDebugKeys: true,
        });
        expect(verify.valid).toBe(true);
        expect(verify.caPubKey).toEqual(expect.any(String));
        expect(verify.rootPubKey).toBe(T2B1rootPubKeyOptiga);
    });

    it('succeeds for tropic (with debug keys)', async () => {
        const verify = await verifyAuthenticityProof({
            ...defaultTropicProps,
            config: CONFIG_WITH_DEBUG_KEYS,
            allowDebugKeys: true,
        });
        expect(verify.valid).toBe(true);
        expect(verify.caPubKey).toEqual(expect.any(String));
        expect(verify.rootPubKey).toBe(T3W1rootPubKeyTropic);
    });

    it('succeeds for MCU (with debug keys)', async () => {
        const verify = await verifyAuthenticityProof({
            ...defaultMCUProps,
            config: CONFIG_WITH_DEBUG_KEYS,
            allowDebugKeys: true,
        });
        expect(verify.valid).toBe(true);
        expect(verify.rootPubKey).toBe(T3W1rootPubKeyMLDSA);
    });

    it('fails for optiga (debug keys not allowed)', async () => {
        const verify = await verifyAuthenticityProof({
            ...defaultOptigaProps,
            config: CONFIG_WITH_DEBUG_KEYS,
        });
        expect(verify.valid).toBe(false);
        expect(verify.error).toBe('ROOT_PUBKEY_NOT_FOUND');
        expect(verify.caPubKey).toEqual(expect.any(String));
        expect(verify.rootPubKey).toBe(undefined);
    });

    it('fails for tropic (debug keys not allowed)', async () => {
        const verify = await verifyAuthenticityProof({
            ...defaultTropicProps,
            config: CONFIG_WITH_DEBUG_KEYS,
        });
        expect(verify.valid).toBe(false);
        expect(verify.error).toBe('ROOT_PUBKEY_NOT_FOUND');
        expect(verify.caPubKey).toEqual(expect.any(String));
        expect(verify.rootPubKey).toBe(undefined);
    });

    it('fails for MCU (debug keys not allowed)', async () => {
        const verify = await verifyAuthenticityProof({
            ...defaultMCUProps,
            config: CONFIG_WITH_DEBUG_KEYS,
        });
        expect(verify.valid).toBe(false);
        expect(verify.error).toBe('ROOT_PUBKEY_NOT_FOUND');
        expect(verify.rootPubKey).toBe(undefined);
    });

    it('fails for optiga (signature mismatch)', async () => {
        const verify = await verifyAuthenticityProof({
            ...defaultOptigaProps,
            signature: `aa${SIGNATURE_OPTIGA.slice(2)}`, // invalid 1st byte of signature
        });

        expect(verify.valid).toBe(false);
        expect(verify.error).toBe('INVALID_DEVICE_SIGNATURE');
        expect(verify.caPubKey).toEqual(expect.any(String));
        expect(verify.rootPubKey).toBe(T2B1rootPubKeyOptiga);
    });

    it('fails for tropic (signature mismatch)', async () => {
        const verify = await verifyAuthenticityProof({
            ...defaultTropicProps,
            signature: `aa${SIGNATURE_TROPIC.slice(2)}`, // invalid 1st byte of signature
        });

        expect(verify.valid).toBe(false);
        expect(verify.error).toBe('INVALID_DEVICE_SIGNATURE');
        expect(verify.caPubKey).toEqual(expect.any(String));
        expect(verify.rootPubKey).toBe(T3W1rootPubKeyTropic);
    });

    it('fails for MCU (signature mismatch)', async () => {
        const verify = await verifyAuthenticityProof({
            ...defaultMCUProps,
            signature: `aa${SIGNATURE_MCU.slice(2)}`, // invalid 1st byte of signature
        });

        expect(verify.valid).toBe(false);
        expect(verify.error).toBe('INVALID_DEVICE_SIGNATURE');
        expect(verify.rootPubKey).toBe(T3W1rootPubKeyMLDSA);
    });

    it('fails for optiga (missing rootPubKey)', async () => {
        const verify = await verifyAuthenticityProof({
            ...defaultOptigaProps,
            config: {
                ...CONFIG,
                T2B1: {
                    ...CONFIG.T2B1,
                    rootPubKeysOptiga: [
                        // invalid root pub key
                        '0423a5c9ec44dfb96023838d958f6289fa611277ee7af60c3bcb54eff2310546d5ece48b1a507503142b122b53eda53fef3f3d3510f3b7ae2fd5f13614b025ede1',
                    ],
                },
            },
        });
        expect(verify.valid).toBe(false);
        expect(verify.error).toBe('ROOT_PUBKEY_NOT_FOUND');
        expect(verify.rootPubKey).toBe(undefined);
    });

    it('fails for tropic (missing rootPubKey)', async () => {
        const verify = await verifyAuthenticityProof({
            ...defaultTropicProps,
            config: {
                ...CONFIG,
                T3W1: {
                    ...CONFIG.T3W1,
                    rootPubKeysTropic: ['deadbeef'.repeat(8)],
                },
            },
        });
        expect(verify.valid).toBe(false);
        expect(verify.error).toBe('ROOT_PUBKEY_NOT_FOUND');
        expect(verify.rootPubKey).toBe(undefined);
    });

    it('fails for MCU (missing rootPubKey)', async () => {
        const verify = await verifyAuthenticityProof({
            ...defaultMCUProps,
            config: {
                ...CONFIG,
                T3W1: {
                    ...CONFIG.T3W1,
                    rootPubKeysMLDSA: ['deadbeef'.repeat(328)],
                },
            },
        });
        expect(verify.valid).toBe(false);
        expect(verify.error).toBe('ROOT_PUBKEY_NOT_FOUND');
        expect(verify.rootPubKey).toBe(undefined);
    });

    it('fails for tropic (no rootPubKeysTropic defined)', async () => {
        const verify = await verifyAuthenticityProof({
            ...defaultTropicProps,
            config: { ...CONFIG, T3W1: { rootPubKeysOptiga: [] } },
        });
        expect(verify.valid).toBe(false);
        expect(verify.error).toBe('ROOT_PUBKEY_NOT_FOUND');
        expect(verify.rootPubKey).toBe(undefined);
    });

    it('fails for MCU (no rootPubKeysTropic defined)', async () => {
        const verify = await verifyAuthenticityProof({
            ...defaultMCUProps,
            config: { ...CONFIG, T3W1: { rootPubKeysOptiga: [] } },
        });
        expect(verify.valid).toBe(false);
        expect(verify.error).toBe('ROOT_PUBKEY_NOT_FOUND');
        expect(verify.rootPubKey).toBe(undefined);
    });

    it('fails for optiga (device model mismatch)', async () => {
        const verify = await verifyAuthenticityProof({
            ...defaultOptigaProps,
            certificates: [
                '3082019e30820145a00302010202044ee2a50f300a06082a8648ce3d040302304f310b300906035504061302435a311e301c060355040a0c155472657a6f7220436f6d70616e7920732e722e6f2e3120301e06035504030c175472657a6f72204d616e75666163747572696e67204341301e170d3232303433303134313630315a170d3432303433303134313630315a301d311b301906035504030c1254324232205472657a6f72205361666520333059301306072a8648ce3d020106082a8648ce3d030107034200049bbf06dad9ab5905e05471ce16d5222c89c2caa39f26267ac0747129885fbd441bcc7fa84de120a36755daf30a6f47e8c0d4bddc15036ed2a3447dfa7a1d3e88a341303f300e0603551d0f0101ff040403020080300c0603551d130101ff04023000301f0603551d23041830168014176d8b9a403574f6a2b9ac353ef578682201a21a300a06082a8648ce3d04030203470030440220747c545e112df816173d3071f1ab25d399d8108550764ce1a3a428f1f18b506902200cda822c75b3da6e44e098014452f3fc324f29a79204c3fb4d5815afafc04b17',
                CA_CERT_OPTIGA,
            ],
        });

        expect(verify.valid).toBe(false);
        expect(verify.error).toBe('INVALID_DEVICE_MODEL');
        expect(verify.rootPubKey).toBe(T2B1rootPubKeyOptiga);
    });

    // device model mismatch case is not relevant for tropic or MCU (supported only by T3W1)

    it('fails for optiga (caPubKey on blacklist)', async () => {
        const verify = await verifyAuthenticityProof({
            ...defaultOptigaProps,
            blacklistConfig: {
                ...BLACKLIST_CONFIG,
                blacklistedCaPubKeys: [
                    '041b36cc98d5e3d1a20677aaf26254ef3756f27c9d63080c93ad3e7d39d3ad23bf00497b924789bc8e3f87834994e16780ad4eae7e75db1f03835ca64363e980b4',
                ],
            },
        });

        expect(verify.valid).toBe(false);
        expect(verify.error).toBe('CA_PUBKEY_BLACKLISTED');
        expect(verify.rootPubKey).toBe(T2B1rootPubKeyOptiga);
    });

    it('fails for tropic (caPubKey on blacklist)', async () => {
        const verify = await verifyAuthenticityProof({
            ...defaultTropicProps,
            blacklistConfig: {
                ...BLACKLIST_CONFIG,
                blacklistedCaPubKeys: [
                    '9603b4971f811ed2a1cdb9ec3e6d6d0e22facfd83892a30480460872a2003f45',
                ],
            },
        });

        expect(verify.valid).toBe(false);
        expect(verify.error).toBe('CA_PUBKEY_BLACKLISTED');
        expect(verify.rootPubKey).toBe(T3W1rootPubKeyTropic);
    });

    // caPubKey blacklist not relevant for MCU as there is no CA certificate

    it('succeeds for Evolu signature (optiga)', async () => {
        const header = 'EvoluSignRegistrationRequestV1:';
        const challenge = '6006b5c68105bd4872129e3ee42383e1f9404c711e433b88557c22c3f94d357e';
        const publicKey =
            '0487472eec47aa28fa62ff3231f60b5c89751318a5598af5f93ab2aad9061ca25f53b352a97b855f16b11b795b715249c8dbfb6e47339f677e30d530f0e80bc4bb';
        const size = 1000;

        const sizeBuffer = Buffer.alloc(4);
        sizeBuffer.writeUInt32BE(size, 0);

        const bufferChunks = [
            Buffer.from(publicKey, 'hex'),
            Buffer.from(challenge, 'hex'),
            sizeBuffer,
        ];
        const signedData = prepareDeviceAuthenticityData({ payload: bufferChunks, prefix: header });

        const verify = await verifyAuthenticityProof({
            ...defaultOptigaProps,
            signedData,
            signature: SIGNATURE_OPTIGA_EVOLU,
        });

        expect(verify.valid).toBe(true);
    });
});

describe(`firmware/${matchRootPubKeyToCertificate.name}`, () => {
    it('matches the valid Optiga root public key for a CA certificate', async () => {
        const cert = parseCertificate(new Uint8Array(Buffer.from(CA_CERT_OPTIGA, 'hex')));
        await expect(
            matchRootPubKeyToCertificate({
                allRootPubKeys: [T2B1rootPubKeyOptiga, T3W1rootPubKeyTropic],
                cert,
            }),
        ).resolves.toBe(T2B1rootPubKeyOptiga);
    });

    it('does not match any root public key for a device certificate', async () => {
        const cert = parseCertificate(new Uint8Array(Buffer.from(DEVICE_CERT_OPTIGA, 'hex')));
        await expect(
            matchRootPubKeyToCertificate({
                allRootPubKeys: [T2B1rootPubKeyOptiga, T3W1rootPubKeyTropic],
                cert,
            }),
        ).resolves.toBe(undefined);
    });
});

describe(`firmware/${prepareDeviceAuthenticityData.name}`, () => {
    it('prepare data with single buffer with default prefix', () => {
        const payload = Buffer.from('deadbeef', 'hex');
        const data = prepareDeviceAuthenticityData({ payload });
        const expectedResult = Buffer.concat([
            bufferUtils.getChunkSize(19),
            Buffer.from('AuthenticateDevice:'),
            bufferUtils.getChunkSize(4),
            payload,
        ]);
        expect(data).toEqual(expectedResult);
    });

    it('prepare data with multiple buffers with custom prefix', () => {
        const payload = [Buffer.from('dead', 'hex'), Buffer.from('beef', 'hex')];
        const data = prepareDeviceAuthenticityData({ payload, prefix: 'Something:' });
        const expectedResult = Buffer.concat([
            bufferUtils.getChunkSize(10),
            Buffer.from('Something:'),
            bufferUtils.getChunkSize(2),
            Buffer.from('dead', 'hex'),
            bufferUtils.getChunkSize(2),
            Buffer.from('beef', 'hex'),
        ]);
        expect(data).toEqual(expectedResult);
    });
});
