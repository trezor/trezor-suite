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
    CardanoGovernanceRegistrationDelegation,
    CardanoGovernanceRegistrationParameters,
} from '../../types/api/cardano';

const MAX_DELEGATION_COUNT = 32;

const transformDelegation = (
    delegation: CardanoGovernanceRegistrationDelegation,
): PROTO.CardanoGovernanceRegistrationDelegation => {
    validateParams(delegation, [
        { name: 'votingPublicKey', type: 'string', required: true },
        { name: 'weight', type: 'uint', required: true },
    ]);

    return {
        voting_public_key: delegation.votingPublicKey,
        weight: delegation.weight,
    };
};

const transformGovernanceRegistrationParameters = (
    governanceRegistrationParameters: CardanoGovernanceRegistrationParameters,
): PROTO.CardanoGovernanceRegistrationParametersType => {
    validateParams(governanceRegistrationParameters, [
        { name: 'votingPublicKey', type: 'string' },
        { name: 'stakingPath', required: true },
        { name: 'nonce', type: 'uint', required: true },
        { name: 'format', type: 'number' },
        { name: 'delegations', type: 'array', allowEmpty: true },
        { name: 'votingPurpose', type: 'uint' },
    ]);
    validateAddressParameters(governanceRegistrationParameters.rewardAddressParameters);

    const { delegations } = governanceRegistrationParameters;
    if (delegations && delegations.length > MAX_DELEGATION_COUNT) {
        throw ERRORS.TypedError(
            'Method_InvalidParameter',
            `At most ${MAX_DELEGATION_COUNT} delegations are allowed in a governance registration`,
        );
    }

    return {
        voting_public_key: governanceRegistrationParameters.votingPublicKey,
        staking_path: validatePath(governanceRegistrationParameters.stakingPath, 3),
        reward_address_parameters: addressParametersToProto(
            governanceRegistrationParameters.rewardAddressParameters,
        ),
        nonce: governanceRegistrationParameters.nonce,
        format: governanceRegistrationParameters.format,
        delegations: delegations?.map(transformDelegation),
        voting_purpose: governanceRegistrationParameters.votingPurpose,
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

    let governanceRegistrationParameters;
    if (auxiliaryData.governanceRegistrationParameters) {
        governanceRegistrationParameters = transformGovernanceRegistrationParameters(
            auxiliaryData.governanceRegistrationParameters,
        );
    }

    return {
        hash: auxiliaryData.hash,
        governance_registration_parameters: governanceRegistrationParameters,
    };
};

export const modifyAuxiliaryDataForBackwardsCompatibility = (
    device: Device,
    auxiliary_data: PROTO.CardanoTxAuxiliaryData,
): PROTO.CardanoTxAuxiliaryData => {
    const { governance_registration_parameters } = auxiliary_data;
    if (governance_registration_parameters) {
        governance_registration_parameters.reward_address_parameters =
            modifyAddressParametersForBackwardsCompatibility(
                device,
                governance_registration_parameters.reward_address_parameters,
            );

        return {
            ...auxiliary_data,
            governance_registration_parameters,
        };
    }

    return auxiliary_data;
};
