// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/helpers/cardanoAuxiliaryData.js

import {
    addressParametersToProto,
    modifyAddressParametersForBackwardsCompatibility,
    validateAddressParameters,
} from './cardanoAddressParameters';
import { validateParams } from '../common/paramsValidator';
import { validatePath } from '../../utils/pathUtils';
import type { Device } from '../../device/Device';
import { ERRORS, PROTO } from '../../constants';
import type {
    CardanoAuxiliaryData,
    CardanoCVoteRegistrationDelegation,
    CardanoCVoteRegistrationParameters,
} from '../../types/api/cardano';

const MAX_DELEGATION_COUNT = 32;

const transformDelegation = (
    delegation: CardanoCVoteRegistrationDelegation,
): PROTO.CardanoCVoteRegistrationDelegation => {
    validateParams(delegation, [
        { name: 'votingPublicKey', type: 'string', required: true },
        { name: 'weight', type: 'uint', required: true },
    ]);

    return {
        voting_public_key: delegation.votingPublicKey,
        weight: delegation.weight,
    };
};

const transformCvoteRegistrationParameters = (
    cVoteRegistrationParameters: CardanoCVoteRegistrationParameters,
): PROTO.CardanoCVoteRegistrationParametersType => {
    // @ts-expect-error rewardAddressParameters is a legacy param kept for backward compatibility (for now)
    if (cVoteRegistrationParameters.rewardAddressParameters) {
        console.warn('Please use paymentAddressParameters instead of rewardAddressParameters.');
        cVoteRegistrationParameters.paymentAddressParameters =
            // @ts-expect-error
            cVoteRegistrationParameters.rewardAddressParameters;
    }

    validateParams(cVoteRegistrationParameters, [
        { name: 'votingPublicKey', type: 'string' },
        { name: 'stakingPath', required: true },
        { name: 'nonce', type: 'uint', required: true },
        { name: 'format', type: 'number' },
        { name: 'delegations', type: 'array', allowEmpty: true },
        { name: 'votingPurpose', type: 'uint' },
        { name: 'address', type: 'string' },
    ]);
    const { paymentAddressParameters } = cVoteRegistrationParameters;
    if (paymentAddressParameters) {
        validateAddressParameters(paymentAddressParameters);
    }

    const { delegations } = cVoteRegistrationParameters;
    if (delegations && delegations.length > MAX_DELEGATION_COUNT) {
        throw ERRORS.TypedError(
            'Method_InvalidParameter',
            `At most ${MAX_DELEGATION_COUNT} delegations are allowed in a CIP-36 registration`,
        );
    }

    return {
        voting_public_key: cVoteRegistrationParameters.votingPublicKey,
        staking_path: validatePath(cVoteRegistrationParameters.stakingPath, 3),
        payment_address_parameters: paymentAddressParameters
            ? addressParametersToProto(paymentAddressParameters)
            : undefined,
        nonce: cVoteRegistrationParameters.nonce,
        format: cVoteRegistrationParameters.format,
        delegations: delegations?.map(transformDelegation),
        voting_purpose: cVoteRegistrationParameters.votingPurpose,
        payment_address: cVoteRegistrationParameters.paymentAddress,
    };
};

export const transformAuxiliaryData = (
    auxiliaryData: CardanoAuxiliaryData,
): PROTO.CardanoTxAuxiliaryData => {
    validateParams(auxiliaryData, [
        {
            name: 'hash',
            type: 'string',
        },
    ]);

    let cVoteRegistrationParameters;
    if (auxiliaryData.cVoteRegistrationParameters) {
        cVoteRegistrationParameters = transformCvoteRegistrationParameters(
            auxiliaryData.cVoteRegistrationParameters,
        );
    }

    return {
        hash: auxiliaryData.hash,
        cvote_registration_parameters: cVoteRegistrationParameters,
    };
};

export const modifyAuxiliaryDataForBackwardsCompatibility = (
    device: Device,
    auxiliary_data: PROTO.CardanoTxAuxiliaryData,
): PROTO.CardanoTxAuxiliaryData => {
    const { cvote_registration_parameters } = auxiliary_data;
    if (cvote_registration_parameters?.payment_address_parameters) {
        cvote_registration_parameters.payment_address_parameters =
            modifyAddressParametersForBackwardsCompatibility(
                device,
                cvote_registration_parameters.payment_address_parameters,
            );

        return {
            ...auxiliary_data,
            cvote_registration_parameters,
        };
    }

    return auxiliary_data;
};
