import { Dispatch } from '@reduxjs/toolkit';

import { DelegatedIdentityKey, TrezorDeviceWithState } from '@suite-common/suite-types';
import {
    getProofOfDelegatedIdentity,
    getPublicIdentityKeyFromDelegatedKey,
} from '@suite-common/wallet-utils';
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
        if (hasPublicKeyStorage.ok) {
            dispatch(
                quotaManagerDeviceFetched({
                    deviceId: device.id,
                    publicKey: getPublicIdentityKeyFromDelegatedKey(delegatedKey),
                    totalStorageSize: hasPublicKeyStorage.value.totalSpace,
                    unspentStorageSize: hasPublicKeyStorage.value.unspentSpace,
                }),
            );

            return;
        }

        // 404 is expected when device is not registered yet, other errors should be shown to the user
        // as quota manager unavailability
        if (!hasPublicKeyStorage.ok && hasPublicKeyStorage.error.code !== 404) {
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

        if (!sessionChallenge.ok) {
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
                challenge: sessionChallenge.value.challenge,
                size: DEFAULT_WALLET_SIZE_QUOTA,
            });

            if (!proofOfDelegatedIdentity.ok) return;

            const registrationRequestResult = await TrezorConnect.evoluSignRegistrationRequest({
                challenge_from_server: sessionChallenge.value.challenge,
                size_to_acquire: DEFAULT_WALLET_SIZE_QUOTA,
                proof_of_delegated_identity: proofOfDelegatedIdentity.value,
            });

            if (registrationRequestResult.success) {
                dispatch(
                    registerStorageThunk({
                        size: DEFAULT_WALLET_SIZE_QUOTA,
                        certificateChain: {
                            deviceCert: registrationRequestResult.payload.certificate_chain[0],
                            caCert: registrationRequestResult.payload.certificate_chain[1],
                        },
                        challenge: sessionChallenge.value.challenge,
                        proof: registrationRequestResult.payload.signature,
                        sessionId: sessionChallenge.value.sessionId,
                        deviceModel: device.features.internal_model,
                        publicKey: getPublicIdentityKeyFromDelegatedKey(delegatedKey),
                    }),
                );
            }
        }
    };
