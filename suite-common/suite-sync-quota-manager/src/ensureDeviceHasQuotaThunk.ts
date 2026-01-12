import { Dispatch } from '@reduxjs/toolkit';

import {
    getProofOfDelegatedIdentity,
    getPublicIdentityKeyFromDelegatedKey,
} from '@suite-common/delegated-identity-key';
import { DelegatedIdentityKey, TrezorDeviceWithState } from '@suite-common/suite-types';
import TrezorConnect from '@trezor/connect';

import { prepareChallengeSession } from './challenge/prepareChallengeSession';
import { DEFAULT_WALLET_SIZE_QUOTA } from './constants';
import { quotaManagerDeviceFetched, quotaManagerFetchError } from './quotaManagerActions';
import { selectIsQuotaManagerEnabled, selectQuotaManagerBaseUrl } from './quotaManagerSelectors';
import { checkStorageByPublicKey } from './storage/checkStorage';
import { registerStorageThunk } from './storage/registerStorageThunk';

const EVOLU_SIGN_REGISTRATION_REQUEST_HEADER = 'EvoluSignRegistrationRequest';

type RegisterStorageIfNeededThunkParams = {
    device: TrezorDeviceWithState;
    delegatedKey: DelegatedIdentityKey;
};

export const ensureDeviceHasQuotaThunk =
    ({ device, delegatedKey }: RegisterStorageIfNeededThunkParams) =>
    async (dispatch: Dispatch, getState: () => any) => {
        if (device === undefined) return;

        const isQuotaManagerEnabled = selectIsQuotaManagerEnabled(getState());
        const quotaManagerBaseUrl = selectQuotaManagerBaseUrl(getState());

        if (!isQuotaManagerEnabled) return;

        const hasPublicKeyStorage = await checkStorageByPublicKey({
            baseUrl: quotaManagerBaseUrl,
            publicKey: getPublicIdentityKeyFromDelegatedKey(delegatedKey),
        });

        // already registered, don't need to register again
        if (hasPublicKeyStorage.success) {
            dispatch(
                quotaManagerDeviceFetched({
                    deviceId: device.id,
                    publicKey: getPublicIdentityKeyFromDelegatedKey(delegatedKey),
                    totalStorageSize: hasPublicKeyStorage.payload.totalSpace,
                    unspentStorageSize: hasPublicKeyStorage.payload.unspentSpace,
                }),
            );

            return;
        }

        // 404 is expected when device is not registered yet, other errors should be shown to the user
        // as quota manager unavailability
        if (!hasPublicKeyStorage.success && hasPublicKeyStorage.error.code !== 404) {
            dispatch(
                quotaManagerFetchError({
                    error: hasPublicKeyStorage.error.message,
                }),
            );

            return;
        }

        const sessionChallenge = await prepareChallengeSession({
            baseUrl: quotaManagerBaseUrl,
        });

        if (!sessionChallenge.success) {
            dispatch(
                quotaManagerFetchError({
                    error: sessionChallenge.error.message,
                }),
            );

            return;
        }

        if (sessionChallenge) {
            const proofOfDelegatedIdentity = getProofOfDelegatedIdentity({
                delegatedKey,
                header: EVOLU_SIGN_REGISTRATION_REQUEST_HEADER,
                challenge: sessionChallenge.payload.challenge,
                size: DEFAULT_WALLET_SIZE_QUOTA,
            });

            if (!proofOfDelegatedIdentity.success) return;

            const registrationRequestResult = await TrezorConnect.evoluSignRegistrationRequest({
                challenge_from_server: sessionChallenge.payload.challenge,
                size_to_acquire: DEFAULT_WALLET_SIZE_QUOTA,
                proof_of_delegated_identity: proofOfDelegatedIdentity.payload,
            });

            if (registrationRequestResult.success) {
                dispatch(
                    registerStorageThunk({
                        size: DEFAULT_WALLET_SIZE_QUOTA,
                        certificateChain: {
                            deviceCert: registrationRequestResult.payload.certificate_chain[0],
                            caCert: registrationRequestResult.payload.certificate_chain[1],
                        },
                        challenge: sessionChallenge.payload.challenge,
                        proof: registrationRequestResult.payload.signature,
                        sessionId: sessionChallenge.payload.sessionId,
                        deviceModel: device.features.internal_model,
                        publicKey: getPublicIdentityKeyFromDelegatedKey(delegatedKey),
                    }),
                );
            }
        }
    };
