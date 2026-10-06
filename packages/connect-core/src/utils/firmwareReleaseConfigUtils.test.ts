import { generateKeyPairSync } from 'crypto';
import { sign } from 'jws';

import type { FirmwareChannel } from '@trezor/connect-common/src/types/firmware';
import type { FirmwareReleaseConfig } from '@trezor/device-utils';
import { typedObjectEntries, typedObjectKeys } from '@trezor/utils';

import { FIRMWARE_REMOTES_CONFIG } from './firmwareReleaseConfigConstants';
import { fetchFirmwareReleaseConfig } from './firmwareReleaseConfigUtils';

const { privateKey: mockDevPrivateKey, publicKey: mockDevPublicKey } = generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
});
const { privateKey: mockCodesignPrivateKey, publicKey: mockCodesignPublicKey } =
    generateKeyPairSync('ec', {
        namedCurve: 'prime256v1',
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        publicKeyEncoding: { type: 'spki', format: 'pem' },
    });
const { privateKey: mockOtherPrivateKey } = generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
});

// jest.mock calls are hoisted above imports, and also above the mock key generation. So it needs to be mocked as a getter.
jest.mock('@trezor/connect-data', () => ({
    ...jest.requireActual('@trezor/connect-data'),
    get firmwareConfigDevPublicKey() {
        return mockDevPublicKey;
    },
    get firmwareConfigCodesignPublicKey() {
        return mockCodesignPublicKey;
    },
}));

const signConfig = (config: FirmwareReleaseConfig, privateKey: string) =>
    sign({ header: { alg: 'ES256' }, payload: JSON.stringify(config), privateKey });

const signForChannel = (channel: FirmwareChannel, config: FirmwareReleaseConfig) =>
    signConfig(
        config,
        FIRMWARE_REMOTES_CONFIG[channel].useProductionKey
            ? mockCodesignPrivateKey
            : mockDevPrivateKey,
    );

const originalFetch = global.fetch;

const mockFetchJsonOnce = (payload: unknown, ok = true, status = 200) => {
    global.fetch = jest.fn().mockResolvedValue({
        ok,
        status,
        json: () => Promise.resolve(payload),
    });
};

const REMOTE_CONFIG = {
    version: 1,
    timestamp: '2024-01-01T00:00:00.000Z',
    sequence: 1,
    releases: {},
    intermediaries: {},
} as FirmwareReleaseConfig;

const ALL_CHANNELS = typedObjectKeys(FIRMWARE_REMOTES_CONFIG);

describe(fetchFirmwareReleaseConfig.name, () => {
    afterEach(() => {
        global.fetch = originalFetch;
        jest.clearAllMocks();
    });

    const configEntries = typedObjectEntries(FIRMWARE_REMOTES_CONFIG);

    const signatureRequiredChannels: FirmwareChannel[] = configEntries
        .filter(([_, { isSignatureOptional }]) => !isSignatureOptional)
        .map(([key]) => key);

    const signatureOptionalChannels: FirmwareChannel[] = configEntries
        .filter(([_, { isSignatureOptional }]) => isSignatureOptional)
        .map(([key]) => key);

    describe.each(signatureRequiredChannels)(
        'channel: %s (JWS is mandatory and its signature is verified)',
        channel => {
            it('returns the remote config when the JWS is valid', async () => {
                mockFetchJsonOnce({ jws: signForChannel(channel, REMOTE_CONFIG) });

                const result = await fetchFirmwareReleaseConfig(channel);

                expect(result).toEqual(REMOTE_CONFIG);
            });

            it('returns undefined when no "jws" envelope is present', async () => {
                mockFetchJsonOnce(REMOTE_CONFIG);

                const result = await fetchFirmwareReleaseConfig(channel);

                expect(result).toBeUndefined();
            });

            it('returns undefined when the JWS signature is invalid', async () => {
                mockFetchJsonOnce({ jws: signConfig(REMOTE_CONFIG, mockOtherPrivateKey) });

                const result = await fetchFirmwareReleaseConfig(channel);

                expect(result).toBeUndefined();
            });
        },
    );

    describe.each(signatureOptionalChannels)('channel: %s (JWS is optional)', channel => {
        it('accepts a raw JSON body with no "jws" envelope', async () => {
            mockFetchJsonOnce(REMOTE_CONFIG);

            const result = await fetchFirmwareReleaseConfig(channel);

            expect(result).toEqual(REMOTE_CONFIG);
        });

        it('still verifies the JWS when a "jws" envelope is present', async () => {
            mockFetchJsonOnce({ jws: signForChannel(channel, REMOTE_CONFIG) });

            const result = await fetchFirmwareReleaseConfig(channel);

            expect(result).toEqual(REMOTE_CONFIG);
        });

        it('never falls back to the raw envelope when the JWS signature is invalid', async () => {
            // Deliberately shaped like a valid config *and* carrying an invalid "jws": if a bug
            // ever caught the verify failure and fell through to treating this payload as raw
            // config, this test would fail by resolving the spoofed config instead of undefined.
            const spoofedPayload = {
                ...REMOTE_CONFIG,
                jws: signConfig(REMOTE_CONFIG, mockOtherPrivateKey),
            };
            mockFetchJsonOnce(spoofedPayload);

            const result = await fetchFirmwareReleaseConfig(channel);

            expect(result).toBeUndefined();
        });
    });

    it('returns undefined when the HTTP request fails', async () => {
        mockFetchJsonOnce({}, false, 500);

        const result = await fetchFirmwareReleaseConfig('production');

        expect(result).toBeUndefined();
    });

    it.each(ALL_CHANNELS)(
        'verifies channel %s against the appropriate codesign key',
        async channel => {
            const { useProductionKey } = FIRMWARE_REMOTES_CONFIG[channel];
            const privateKey = useProductionKey ? mockCodesignPrivateKey : mockDevPrivateKey;

            mockFetchJsonOnce({ jws: signConfig(REMOTE_CONFIG, privateKey) });

            const result = await fetchFirmwareReleaseConfig(channel);

            expect(result).toEqual(REMOTE_CONFIG);
        },
    );
});
