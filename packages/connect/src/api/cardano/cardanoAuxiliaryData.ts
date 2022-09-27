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
    CardanoCatalystRegistrationDelegation,
    CardanoCatalystRegistrationParameters,
} from '../../types/api/cardano';

const MAX_DELEGATION_COUNT = 32;

const transformDelegation = (
    delegation: CardanoCatalystRegistrationDelegation,
): PROTO.CardanoCatalystRegistrationDelegation => {
    validateParams(delegation, [
        { name: 'votingPublicKey', type: 'string', required: true },
        { name: 'weight', type: 'uint', required: true },
    ]);

    return {
        voting_public_key: delegation.votingPublicKey,
        weight: delegation.weight,
    };
};

const transformCatalystRegistrationParameters = (
    catalystRegistrationParameters: CardanoCatalystRegistrationParameters,
): PROTO.CardanoCatalystRegistrationParametersType => {
    validateParams(catalystRegistrationParameters, [
        { name: 'votingPublicKey', type: 'string' },
        { name: 'stakingPath', required: true },
        { name: 'nonce', type: 'uint', required: true },
        { name: 'format', type: 'number' },
        { name: 'delegations', type: 'array', allowEmpty: true },
        { name: 'votingPurpose', type: 'uint' },
    ]);
    validateAddressParameters(catalystRegistrationParameters.rewardAddressParameters);

    const { delegations } = catalystRegistrationParameters;
    if (delegations && delegations.length > MAX_DELEGATION_COUNT) {
        throw ERRORS.TypedError(
            'Method_InvalidParameter',
            `At most ${MAX_DELEGATION_COUNT} delegations are allowed in a Catalyst registration`,
        );
    }

    return {
        voting_public_key: catalystRegistrationParameters.votingPublicKey,
        staking_path: validatePath(catalystRegistrationParameters.stakingPath, 3),
        reward_address_parameters: addressParametersToProto(
            catalystRegistrationParameters.rewardAddressParameters,
        ),
        nonce: catalystRegistrationParameters.nonce,
        format: catalystRegistrationParameters.format,
        delegations: delegations?.map(transformDelegation),
        voting_purpose: catalystRegistrationParameters.votingPurpose,
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

    let catalystRegistrationParameters;
    if (auxiliaryData.catalystRegistrationParameters) {
        catalystRegistrationParameters = transformCatalystRegistrationParameters(
            auxiliaryData.catalystRegistrationParameters,
        );
    }

    return {
        hash: auxiliaryData.hash,
        catalyst_registration_parameters: catalystRegistrationParameters,
    };
};

export const modifyAuxiliaryDataForBackwardsCompatibility = (
    device: Device,
    auxiliary_data: PROTO.CardanoTxAuxiliaryData,
): PROTO.CardanoTxAuxiliaryData => {
    const { catalyst_registration_parameters } = auxiliary_data;
    if (catalyst_registration_parameters) {
        catalyst_registration_parameters.reward_address_parameters =
            modifyAddressParametersForBackwardsCompatibility(
                device,
                catalyst_registration_parameters.reward_address_parameters,
            );

        return {
            ...auxiliary_data,
            catalyst_registration_parameters,
        };
    }

    return auxiliary_data;
};
