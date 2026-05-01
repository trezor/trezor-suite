import { bufferUtils } from '@trezor/utils';

import {
    CA_CERT_OPTIGA,
    DEVICE_CERT_OPTIGA,
    SIGNATURE_OPTIGA_EVOLU,
    T2B1_ROOT_PUB_KEY_OPTIGA,
    T3W1_ROOT_PUB_KEY_TROPIC,
    defaultOptigaProps,
} from '../../mocks/mockDeviceAuthenticityData';
import { verifyAuthenticityProofFixtures } from '../__fixtures__/verifyAuthenticityProof';
import { getRootPubKeys } from '../utils';
import {
    matchRootPubKeyToCertificate,
    prepareDeviceAuthenticityData,
    verifyAuthenticityProof,
} from '../verifyAuthenticityProof';
import { parseCertificate } from '../x509certificate';

describe(verifyAuthenticityProof.name, () => {
    verifyAuthenticityProofFixtures.forEach(({ description, params, result }) => {
        it(description, async () => {
            const actualResult = await verifyAuthenticityProof(params);
            expect(actualResult).toEqual(result);
        });
    });

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

describe(matchRootPubKeyToCertificate.name, () => {
    it('matches the valid Optiga root public key for a CA certificate', async () => {
        const cert = parseCertificate(new Uint8Array(Buffer.from(CA_CERT_OPTIGA, 'hex')));
        await expect(
            matchRootPubKeyToCertificate({
                allRootPubKeys: [T2B1_ROOT_PUB_KEY_OPTIGA, T3W1_ROOT_PUB_KEY_TROPIC],
                cert,
            }),
        ).resolves.toBe(T2B1_ROOT_PUB_KEY_OPTIGA);
    });

    it('does not match any root public key for a device certificate', async () => {
        const cert = parseCertificate(new Uint8Array(Buffer.from(DEVICE_CERT_OPTIGA, 'hex')));
        await expect(
            matchRootPubKeyToCertificate({
                allRootPubKeys: [T2B1_ROOT_PUB_KEY_OPTIGA, T3W1_ROOT_PUB_KEY_TROPIC],
                cert,
            }),
        ).resolves.toBe(undefined);
    });

    verifyAuthenticityProofFixtures.forEach(({ description, params, result }) => {
        it(description, async () => {
            const { config, deviceModel, allowDebugKeys, certificates } = params;
            const allRootPubKeys = getRootPubKeys({ config, deviceModel, allowDebugKeys });

            // The last certificate is the one signed by root pub key (caCer for Optiga & Tropic, deviceCert for MCU)
            const signedCertificate = certificates.at(-1);
            if (!signedCertificate) throw 'Missing expceted certificates in test fixture';
            const cert = parseCertificate(new Uint8Array(Buffer.from(signedCertificate, 'hex')));
            const match = await matchRootPubKeyToCertificate({ allRootPubKeys, cert });
            expect(match).toBe(result.rootPubKey);
        });
    });
});

describe(prepareDeviceAuthenticityData.name, () => {
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
