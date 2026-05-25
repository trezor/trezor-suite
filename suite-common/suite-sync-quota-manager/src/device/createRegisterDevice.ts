import { type Dispatch } from '@reduxjs/toolkit';

import {
    getProofOfDelegatedIdentity,
    getPublicIdentityKeyFromDelegatedKey,
} from '@suite-common/delegated-identity-key';
import { type ProofOfDelegatedSignFailedType } from '@suite-common/delegated-identity-key-types';
import { DeviceError } from '@suite-common/device';
import { type QuotaManagerCommunicationFailedErrType } from '@suite-common/suite-sync-types';
import {
    type DelegatedIdentityKey,
    type DeviceErrorType,
    type TrezorDeviceWithState,
} from '@suite-common/suite-types';
import { type TrezorConnect } from '@trezor/connect';
import { type Result, err, ok } from '@trezor/type-utils';

import { DEFAULT_DEVICE_SIZE_QUOTA } from '../constants';
import { QuotaManagerCommunicationFailed } from '../errors';
import { type RegisterDeviceFetchDep } from './createRegisterDeviceFetch';
import { quotaManagerDeviceFetched } from '../quotaManagerActions';
import { prepareMessageBufferEvoluSignRegistrationRequest } from './prepareMessageBufferEvoluSignRegistrationRequest';
import { type PrepareChallengeSessionFetchDep } from '../challenge/createPrepareChallengeSessionFetch';

const EVOLU_SIGN_REGISTRATION_REQUEST_HEADER = 'EvoluSignRegistrationRequest';

export type RegisterDeviceParams = {
    device: TrezorDeviceWithState;
    delegatedKey: DelegatedIdentityKey;
};

export type RegisterDevice = (
    params: RegisterDeviceParams,
) => Promise<
    Result<
        void,
        QuotaManagerCommunicationFailedErrType | ProofOfDelegatedSignFailedType | DeviceErrorType
    >
>;

export type RegisterDeviceDeps = {
    dispatch: Dispatch;
    trezorConnect: Pick<TrezorConnect, 'evoluSignRegistrationRequest'>;
} & RegisterDeviceFetchDep &
    PrepareChallengeSessionFetchDep;

export type RegisterDeviceDep = {
    registerDevice: RegisterDevice;
};

export const createRegisterDevice =
    (deps: RegisterDeviceDeps): RegisterDevice =>
    async ({ device, delegatedKey }) => {
        const delegatedKeyPublic = getPublicIdentityKeyFromDelegatedKey(delegatedKey);

        const sessionChallenge = await deps.prepareChallengeSessionFetch();

        if (!sessionChallenge.success) {
            return err(QuotaManagerCommunicationFailed(sessionChallenge.error));
        }

        const proofOfDelegatedIdentity = getProofOfDelegatedIdentity({
            delegatedKey,
            header: EVOLU_SIGN_REGISTRATION_REQUEST_HEADER,
            appendMessageBuffer: prepareMessageBufferEvoluSignRegistrationRequest({
                challenge: sessionChallenge.payload.challenge,
                size: DEFAULT_DEVICE_SIZE_QUOTA,
            }),
        });

        if (!proofOfDelegatedIdentity.success) {
            return proofOfDelegatedIdentity;
        }

        const registrationRequestResult = await deps.trezorConnect.evoluSignRegistrationRequest({
            challenge_from_server: sessionChallenge.payload.challenge,
            size_to_acquire: DEFAULT_DEVICE_SIZE_QUOTA,
            proof_of_delegated_identity: proofOfDelegatedIdentity.payload,
        });

        if (!registrationRequestResult.success) {
            return err(DeviceError(registrationRequestResult.error.message));
        }

        const { certificate_chain } = registrationRequestResult.payload;
        // @ts-expect-error: noUncheckedIndexedAccess
        const deviceCert: (typeof certificate_chain)[number] = certificate_chain[0];
        // @ts-expect-error: noUncheckedIndexedAccess
        const caCert: (typeof certificate_chain)[number] = certificate_chain[1];
        const registerDeviceResult = await deps.registerDeviceFetch({
            deviceId: device.id,
            size: DEFAULT_DEVICE_SIZE_QUOTA,
            certificateChain: {
                deviceCert,
                caCert,
            },
            challenge: sessionChallenge.payload.challenge,
            proof: registrationRequestResult.payload.signature,
            sessionId: sessionChallenge.payload.sessionId,
            deviceModel: device.features.internal_model,
            publicKey: delegatedKeyPublic,
        });

        if (!registerDeviceResult.success) {
            return err(QuotaManagerCommunicationFailed(registerDeviceResult.error));
        }

        deps.dispatch(
            quotaManagerDeviceFetched({
                deviceId: device.id,
                totalStorageSize: registerDeviceResult.payload.totalStorageSize,
                unspentStorageSize: registerDeviceResult.payload.unspentStorageSize,
            }),
        );

        return ok();
    };
