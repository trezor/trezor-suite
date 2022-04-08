// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/helpers/cardanoAuxiliaryData.js

import {
    addressParametersToProto,
    modifyAddressParametersForBackwardsCompatibility,
    validateAddressParameters,
} from './cardanoAddressParameters';
import { validateParams } from '../common/paramsValidator';
import { validatePath } from '../../utils/pathUtils';
import type { Device } from '../../device/Device';
import type { PROTO } from '../../constants';
import type {
    CardanoAuxiliaryData,
    CardanoCatalystRegistrationParameters,
} from '../../types/api/cardanoSignTransaction';

const transformCatalystRegistrationParameters = (
    catalystRegistrationParameters: CardanoCatalystRegistrationParameters,
): PROTO.CardanoCatalystRegistrationParametersType => {
    validateParams(catalystRegistrationParameters, [
        { name: 'votingPublicKey', type: 'string', required: true },
        { name: 'stakingPath', required: true },
        { name: 'nonce', type: 'uint', required: true },
    ]);
    validateAddressParameters(catalystRegistrationParameters.rewardAddressParameters);

    return {
        voting_public_key: catalystRegistrationParameters.votingPublicKey,
        staking_path: validatePath(catalystRegistrationParameters.stakingPath, 3),
        reward_address_parameters: addressParametersToProto(
            catalystRegistrationParameters.rewardAddressParameters,
        ),
        nonce: catalystRegistrationParameters.nonce,
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
