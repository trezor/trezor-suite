/** This file is no longer automatically generated  */
import type { DeviceAuthenticityConfig } from './deviceAuthenticityConfigTypes';

/**
 * How to update this config or check Sentry "Device authenticity invalid!" error? Please read this internal description:
 * https://www.notion.so/satoshilabs/Device-authenticity-check-b8656a0fe3ab4a0d84c61534a73de462?pvs=4
 *
 * These public keys align with the upstream definitions (authoritative source):
 * https://github.com/trezor/trezor-firmware/blob/00742eb2702551c6db191e9b019b12368878c362/core/embed/projects/prodtest/cmd/hsm_keys.h
 * The keys are unique unless stated otherwise.
 */
export const deviceAuthenticityConfig: DeviceAuthenticityConfig = {
    version: 2,
    T2B1: {
        rootPubKeysOptiga: [
            // upstream: DEV_AUTH_ROOT_PROD_P256
            '04ca97480ac0d7b1e6efafe518cd433cec2bf8ab9822d76eafd34363b55d63e60380bff20acc75cde03cffcb50ab6f8ce70c878e37ebc58ff7cca0a83b16b15fa5',
        ],
        debug: {
            rootPubKeysOptiga: [
                // upstream: DEV_AUTH_ROOT_DEBUG_P256 shared with T3B1
                '047f77368dea2d4d61e989f474a56723c3212dacf8a808d8795595ef38441427c4389bc454f02089d7f08b873005e4c28d432468997871c0bf286fd3861e21e96a',
            ],
        },
    },
    T3B1: {
        rootPubKeysOptiga: [
            // upstream: DEV_AUTH_ROOT_PROD_P256
            '045b5c3fdd01f3602092834209b86df0ca86a9faf25cac35c73bf6237d66eb21eafcec3706f1ccd5eb4cc7f2fa1751213eccb1c78389afba89a5788ff31ee46a5d',
        ],
        debug: {
            rootPubKeysOptiga: [
                // upstream: DEV_AUTH_ROOT_DEBUG_P256 shared with T2B1
                '047f77368dea2d4d61e989f474a56723c3212dacf8a808d8795595ef38441427c4389bc454f02089d7f08b873005e4c28d432468997871c0bf286fd3861e21e96a',
            ],
        },
    },
    T3T1: {
        rootPubKeysOptiga: [
            // upstream: DEV_AUTH_ROOT_PROD_P256
            '041854b27fb1d9f65abb66828e78c9dc0ca301e66081ab0c6a4d104f9df1cd0ad5a7c75f77a8c092f55cf825d2abaf734f934c9394d5e75f75a5a06a5ee9be93ae',
        ],
        debug: {
            rootPubKeysOptiga: [
                // upstream: DEV_AUTH_ROOT_DEBUG_P256
                '04e48b69cd7962068d3cca3bcc6b1747ef496c1e28b5529e34ad7295215ea161dbe8fb08ae0479568f9d2cb07630cb3e52f4af0692102da5873559e45e9fa72959',
            ],
        },
    },
    // Note that since T3W1, both "staging" and "debug" keys are used as debug keys.
    // For Tropic Ed25519, only staging keys are available, and expected at emulated devices.
    T3W1: {
        rootPubKeysOptiga: [
            // upstream: DEV_AUTH_ROOT_PROD_P256
            '040dde0d3e0d4da593fac6fd02a461d0e7eef238aca55c7c50b4e9ec37f3873303b6429ef1c9b78b4411a7dcbbc5dde5225979c1c2da3b073e82b1ed3f5f9825bb',
            // upstream: DEV_AUTH_ROOT_PROD_BACKUP_P256
            '04c6a673af4ec44b10441b1d78676e15173ad0e36df9f7f2fa1cd819955f20fe32917b60da5fed3b3aa54a9ab8b3ed27d198b3768cad26eef5935cd87af0af065e',
        ],
        rootPubKeysTropic: [
            // upstream: DEV_AUTH_ROOT_PROD_ED25519
            '59237acd17134061d655b3f8d624573ca06ce8d862f38ba4e05140ce1d3d609d',
            // upstream: DEV_AUTH_ROOT_PROD_BACKUP_ED25519
            '5612606584ee7e0bc313b13f7ac94156bb4cb75bd77585ddbe579301306e85f1',
        ],
        debug: {
            rootPubKeysOptiga: [
                // upstream: DEV_AUTH_ROOT_DEBUG_P256
                '04521192e173a9da4e3023f747d836563725372681eba3079c56ff11b2fc137ab189eb4155f371127651b5594f8c332fc1e9c0f3b80d4212822668b63189706578',
                // upstream: DEV_AUTH_ROOT_STAGING_P256
                '0465e88f9b2cea67e8364f0cfcfacd500af24e9040b357beee629ccc4fce1704d1a7ef7284f387708f92ef14600e2caad6894016fee819d623b95d66210c3e7519',
            ],
            rootPubKeysTropic: [
                // upstream: DEV_AUTH_ROOT_STAGING_ED25519
                'cd318dc8405ae4f4144e3284dcb7b0cb0f0c2195c2ca14a0f6fccd9104e32a4b',
            ],
        },
    },
};
