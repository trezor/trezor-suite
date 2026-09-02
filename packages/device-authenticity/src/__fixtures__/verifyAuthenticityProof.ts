import {
    BLACKLIST_CONFIG,
    CA_CERT_OPTIGA,
    CA_CERT_TROPIC,
    CA_PUB_KEY_OPTIGA,
    CA_PUB_KEY_TROPIC,
    CONFIG,
    CONFIG_WITH_DEBUG_KEYS,
    DEVICE_CERT_MCU,
    DEVICE_CERT_OPTIGA,
    DEVICE_CERT_TROPIC,
    SIGNATURE_MCU,
    SIGNATURE_OPTIGA,
    SIGNATURE_TROPIC,
    T2B1_ROOT_PUB_KEY_OPTIGA,
    T3W1_ROOT_PUB_KEY_MLDSA,
    T3W1_ROOT_PUB_KEY_TROPIC,
    defaultMCUProps,
    defaultOptigaProps,
    defaultTropicProps,
} from '../../mocks/mockDeviceAuthenticityData';
import type { VerifyAuthenticityProofParams, VerifyAuthenticityProofResult } from '../types';

export interface Fixture {
    description: string;
    params: VerifyAuthenticityProofParams;
    result: VerifyAuthenticityProofResult;
}

// In a hex-encoded data, search for a given plaintext searchValue (searched as hex) and replace it with a given plaintext replaceValue (converted to hex)
const replaceInHex = (hexData: string, searchValue: string, replaceValue: string) =>
    hexData.replace(
        Buffer.from(searchValue).toString('hex'),
        Buffer.from(replaceValue).toString('hex'),
    );

/*
 Fixtures common for matchRootPubKeyToCertificate and verifyAuthenticityProof.
 Most test cases are applied three times similarly for Optiga, Tropic and MCU.
*/
export const matchRootPubKeyToCertificateFixtures: Fixture[] = [
    // The most common happy path that mimicks a production device & an ordinary user.
    {
        description: 'succeeds for optiga (with prod keys)',
        params: defaultOptigaProps,
        result: {
            valid: true,
            rootPubKey: T2B1_ROOT_PUB_KEY_OPTIGA,
            caPubKey: CA_PUB_KEY_OPTIGA,
        },
    },
    {
        description: 'succeeds for tropic (with prod keys)',
        params: defaultTropicProps,
        result: {
            valid: true,
            rootPubKey: T3W1_ROOT_PUB_KEY_TROPIC,
            caPubKey: CA_PUB_KEY_TROPIC,
            serialNumber: '343732303930323235323232323232323232323232323232',
        },
    },
    {
        description: 'succeeds for MCU (with prod keys)',
        params: defaultMCUProps,
        result: {
            valid: true,
            rootPubKey: T3W1_ROOT_PUB_KEY_MLDSA,
            serialNumber: '3437333032313932363030303972',
        },
    },

    // Development device and the application is set to accept it (developer / power user).
    {
        description: 'succeeds for optiga (with debug keys)',
        params: {
            ...defaultOptigaProps,
            config: CONFIG_WITH_DEBUG_KEYS,
            allowDebugKeys: true,
        },
        result: {
            valid: true,
            rootPubKey: T2B1_ROOT_PUB_KEY_OPTIGA,
            caPubKey: CA_PUB_KEY_OPTIGA,
        },
    },
    {
        description: 'succeeds for tropic (with debug keys)',
        params: {
            ...defaultTropicProps,
            config: CONFIG_WITH_DEBUG_KEYS,
            allowDebugKeys: true,
        },
        result: {
            valid: true,
            rootPubKey: T3W1_ROOT_PUB_KEY_TROPIC,
            caPubKey: CA_PUB_KEY_TROPIC,
            serialNumber: '343732303930323235323232323232323232323232323232',
        },
    },
    {
        description: 'succeeds for MCU (with debug keys)',
        params: {
            ...defaultMCUProps,
            config: CONFIG_WITH_DEBUG_KEYS,
            allowDebugKeys: true,
        },
        result: {
            valid: true,
            rootPubKey: T3W1_ROOT_PUB_KEY_MLDSA,
            serialNumber: '3437333032313932363030303972',
        },
    },

    // Development device and an ordinary user, application must treat it as counterfeit.
    {
        description: 'fails for optiga (debug keys not allowed)',
        params: {
            ...defaultOptigaProps,
            config: CONFIG_WITH_DEBUG_KEYS,
        },
        result: {
            valid: false,
            error: 'ROOT_PUBKEY_NOT_FOUND',
            caPubKey: CA_PUB_KEY_OPTIGA,
        },
    },
    {
        description: 'fails for tropic (debug keys not allowed)',
        params: {
            ...defaultTropicProps,
            config: CONFIG_WITH_DEBUG_KEYS,
        },
        result: {
            valid: false,
            error: 'ROOT_PUBKEY_NOT_FOUND',
            caPubKey: CA_PUB_KEY_TROPIC,
        },
    },
    {
        description: 'fails for MCU (debug keys not allowed)',
        params: {
            ...defaultMCUProps,
            config: CONFIG_WITH_DEBUG_KEYS,
        },
        result: {
            valid: false,
            error: 'ROOT_PUBKEY_NOT_FOUND',
        },
    },

    /*
     From now on these are all unacceptable behaviors for either production or development device.
    */
    {
        description: 'fails for optiga (invalid signature)',
        params: {
            ...defaultOptigaProps,
            signature: `aa${SIGNATURE_OPTIGA.slice(2)}`,
        },
        result: {
            valid: false,
            error: 'INVALID_DEVICE_SIGNATURE',
            caPubKey: CA_PUB_KEY_OPTIGA,
            rootPubKey: T2B1_ROOT_PUB_KEY_OPTIGA,
        },
    },
    {
        description: 'fails for tropic (invalid signature)',
        params: {
            ...defaultTropicProps,
            signature: `aa${SIGNATURE_TROPIC.slice(2)}`,
        },
        result: {
            valid: false,
            error: 'INVALID_DEVICE_SIGNATURE',
            caPubKey: CA_PUB_KEY_TROPIC,
            rootPubKey: T3W1_ROOT_PUB_KEY_TROPIC,
        },
    },
    {
        description: 'fails for MCU (invalid signature)',
        params: {
            ...defaultMCUProps,
            signature: `aa${SIGNATURE_MCU.slice(2)}`,
        },
        result: {
            valid: false,
            error: 'INVALID_DEVICE_SIGNATURE',
            rootPubKey: T3W1_ROOT_PUB_KEY_MLDSA,
        },
    },

    // For test code simplicity, we are mocking the config rather than certificates, but with the meaning:
    // certificates are signed by an unrecognized key, not matched by the official keys = mocked ones.
    {
        description: 'fails for optiga (no matching rootPubKey)',
        params: {
            ...defaultOptigaProps,
            config: {
                ...CONFIG,
                T2B1: { ...CONFIG.T2B1, rootPubKeysOptiga: ['b'.repeat(130)] },
            },
        },
        result: { valid: false, error: 'ROOT_PUBKEY_NOT_FOUND', caPubKey: CA_PUB_KEY_OPTIGA },
    },
    {
        description: 'fails for tropic (no matching rootPubKey)',
        params: {
            ...defaultTropicProps,
            config: {
                ...CONFIG,
                T3W1: { ...CONFIG.T3W1, rootPubKeysTropic: ['deadbeef'.repeat(8)] },
            },
        },
        result: { valid: false, error: 'ROOT_PUBKEY_NOT_FOUND', caPubKey: CA_PUB_KEY_TROPIC },
    },
    {
        description: 'fails for MCU (no matching rootPubKey)',
        params: {
            ...defaultMCUProps,
            config: {
                ...CONFIG,
                T3W1: { ...CONFIG.T3W1, rootPubKeysMLDSA: ['deadbeef'.repeat(328)] },
            },
        },
        result: { valid: false, error: 'ROOT_PUBKEY_NOT_FOUND' },
    },

    // Not an expected case, just to cover all grounds.
    {
        description: 'fails for optiga (no rootPubKeys defined at all)',
        params: {
            ...defaultOptigaProps,
            config: { ...CONFIG, T2B1: { rootPubKeysOptiga: [] } },
        },
        result: { valid: false, error: 'ROOT_PUBKEY_NOT_FOUND', caPubKey: CA_PUB_KEY_OPTIGA },
    },
    {
        description: 'fails for tropic (no rootPubKeys defined at all)',
        params: {
            ...defaultTropicProps,
            config: { ...CONFIG, T3W1: { rootPubKeysOptiga: [] } },
        },
        result: { valid: false, error: 'ROOT_PUBKEY_NOT_FOUND', caPubKey: CA_PUB_KEY_TROPIC },
    },
    {
        description: 'fails for MCU (no rootPubKeys defined at all)',
        params: {
            ...defaultMCUProps,
            config: { ...CONFIG, T3W1: { rootPubKeysOptiga: [] } },
        },
        result: { valid: false, error: 'ROOT_PUBKEY_NOT_FOUND' },
    },

    {
        description: 'fails for optiga (device model mismatch)',
        params: {
            ...defaultOptigaProps,
            certificates: [replaceInHex(DEVICE_CERT_OPTIGA, 'T2B1', 'T2B2'), CA_CERT_OPTIGA],
        },
        result: {
            valid: false,
            error: 'INVALID_DEVICE_MODEL',
            caPubKey: CA_PUB_KEY_OPTIGA,
            rootPubKey: T2B1_ROOT_PUB_KEY_OPTIGA,
        },
    },
    {
        description: 'fails for tropic (device model mismatch)',
        params: {
            ...defaultTropicProps,
            certificates: [replaceInHex(DEVICE_CERT_TROPIC, 'T3W1', 'T3T1'), CA_CERT_TROPIC],
        },
        result: {
            valid: false,
            error: 'INVALID_DEVICE_MODEL',
            caPubKey: CA_PUB_KEY_TROPIC,
            rootPubKey: T3W1_ROOT_PUB_KEY_TROPIC,
        },
    },
    // In case of MCU check, it's the deviceCert that is signed with rootPubKey, not CA cert, so there is currently
    // no way to get 'INVALID_DEVICE_MODEL', because tampering that certificate part invalidates the rootPubKey signature.
    {
        description: 'fails for MCU (device model mismatch)',
        params: {
            ...defaultMCUProps,
            certificates: [replaceInHex(DEVICE_CERT_MCU, 'T3W1', 'T3B1')],
        },
        result: { valid: false, error: 'ROOT_PUBKEY_NOT_FOUND' },
    },

    {
        description: 'fails for optiga (caPubKey on blacklist)',
        params: {
            ...defaultOptigaProps,
            blacklistConfig: { ...BLACKLIST_CONFIG, blacklistedCaPubKeys: [CA_PUB_KEY_OPTIGA] },
        },
        result: {
            valid: false,
            error: 'CA_PUBKEY_BLACKLISTED',
            caPubKey: CA_PUB_KEY_OPTIGA,
            rootPubKey: T2B1_ROOT_PUB_KEY_OPTIGA,
        },
    },
    {
        description: 'fails for tropic (caPubKey on blacklist)',
        params: {
            ...defaultTropicProps,
            blacklistConfig: { ...BLACKLIST_CONFIG, blacklistedCaPubKeys: [CA_PUB_KEY_TROPIC] },
        },
        result: {
            valid: false,
            error: 'CA_PUBKEY_BLACKLISTED',
            caPubKey: CA_PUB_KEY_TROPIC,
            rootPubKey: T3W1_ROOT_PUB_KEY_TROPIC,
        },
    },
    {
        description: 'fails with INVALID_DEVICE_CERTIFICATE on mismatched signature algorithms',
        params: {
            ...defaultOptigaProps,
            certificates: [DEVICE_CERT_OPTIGA, CA_CERT_TROPIC],
        },
        result: {
            valid: false,
            error: 'INVALID_DEVICE_CERTIFICATE',
            errorDetails: 'Mismatched signature algorithms in device and CA certificates',
        },
    },
    {
        description: 'fails with INVALID_DEVICE_CERTIFICATE when CA cert extensions are invalid',
        params: {
            ...defaultOptigaProps,
            certificates: [CA_CERT_OPTIGA, DEVICE_CERT_OPTIGA],
        },
        result: {
            valid: false,
            error: 'INVALID_DEVICE_CERTIFICATE',
            errorDetails: 'CA keyCertSign not set',
        },
    },
    {
        description:
            'fails with INVALID_DEVICE_CERTIFICATE when Ed25519 CA cert extensions are invalid',
        params: {
            ...defaultTropicProps,
            certificates: [CA_CERT_TROPIC, DEVICE_CERT_TROPIC],
        },
        result: {
            valid: false,
            error: 'INVALID_DEVICE_CERTIFICATE',
            errorDetails: 'CA keyCertSign not set',
        },
    },
    {
        description: 'fails with INVALID_DEVICE_CERTIFICATE when device cert is not signed by CA',
        params: {
            ...defaultOptigaProps,
            certificates: [`${DEVICE_CERT_OPTIGA.slice(0, -2)}ff`, CA_CERT_OPTIGA],
        },
        result: {
            valid: false,
            caPubKey: CA_PUB_KEY_OPTIGA,
            rootPubKey: T2B1_ROOT_PUB_KEY_OPTIGA,
            error: 'INVALID_DEVICE_CERTIFICATE',
        },
    },
];

// Fixtures that are not applicable for matchRootPubKeyToCertificate
export const verifyAuthenticityProofFixtures: Fixture[] = [
    ...matchRootPubKeyToCertificateFixtures,
    // Error detail scenarios — invalid inputs caught and wrapped in result objects.
    {
        description:
            'fails with ROOT_PUBKEY_NOT_FOUND for optiga certificates with tropic proof type',
        params: {
            ...defaultOptigaProps,
            proofType: 'tropic',
        },
        result: { valid: false, error: 'INVALID_DEVICE_CERTIFICATE' },
    },
    {
        description: 'fails with ROOT_PUBKEY_NOT_FOUND for tropic certificates with MCU proof type',
        params: {
            ...defaultTropicProps,
            proofType: 'mcu',
        },
        result: { valid: false, error: 'INVALID_DEVICE_CERTIFICATE' },
    },
    {
        description: 'fails with ROOT_PUBKEY_NOT_FOUND for MCU certificates with optiga proof type',
        params: {
            ...defaultMCUProps,
            proofType: 'optiga',
        },
        result: { valid: false, error: 'INVALID_DEVICE_CERTIFICATE' },
    },
    {
        description: 'fails with INVALID_DEVICE_MODEL for unknown device model',
        params: {
            ...defaultOptigaProps,
            deviceModel: 'UNKNOWN',
        },
        result: { valid: false, error: 'INVALID_DEVICE_MODEL' },
    },
    {
        description: 'fails with INVALID_DEVICE_CERTIFICATE on malformed certificate hex',
        params: {
            ...defaultOptigaProps,
            certificates: ['not-valid-hex'],
        },
        result: {
            valid: false,
            error: 'INVALID_DEVICE_CERTIFICATE',
            errorDetails: "This can't be an X.509 certificate. Wrong data type.",
        },
    },
    {
        description: 'fails with INVALID_DEVICE_CERTIFICATE on truncated certificate',
        params: {
            ...defaultOptigaProps,
            certificates: [DEVICE_CERT_OPTIGA.slice(0, 20), CA_CERT_OPTIGA],
        },
        result: {
            valid: false,
            error: 'INVALID_DEVICE_CERTIFICATE',
            errorDetails: 'Certificate contains more than the three specified children.',
        },
    },
    {
        description: 'fails with RESPONSE_MALFORMED on empty certificates',
        params: {
            ...defaultOptigaProps,
            certificates: [],
        },
        result: { valid: false, error: 'RESPONSE_MALFORMED' },
    },
    {
        description: 'fails with RESPONSE_MALFORMED when P-256 path receives wrong cert count',
        params: {
            ...defaultOptigaProps,
            certificates: [DEVICE_CERT_OPTIGA],
        },
        result: { valid: false, error: 'RESPONSE_MALFORMED' },
    },
    {
        description: 'fails with RESPONSE_MALFORMED when MLDSA44 path receives wrong cert count',
        params: {
            ...defaultMCUProps,
            certificates: [DEVICE_CERT_MCU, DEVICE_CERT_MCU],
        },
        result: { valid: false, error: 'RESPONSE_MALFORMED' },
    },
];
