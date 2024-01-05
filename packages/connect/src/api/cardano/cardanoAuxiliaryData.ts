// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/helpers/cardanoAuxiliaryData.js

import {
    addressParametersToProto,
    modifyAddressParametersForBackwardsCompatibility,
    validateAddressParameters,
} from './cardanoAddressParameters';
import { validatePath } from '../../utils/pathUtils';
import type { Device } from '../../device/Device';
import { ERRORS, PROTO } from '../../constants';
import {
    CardanoAuxiliaryData,
    CardanoCVoteRegistrationDelegation,
    CardanoCVoteRegistrationParameters,
} from '../../types/api/cardano';
import { Assert } from '@trezor/schema-utils';

const MAX_DELEGATION_COUNT = 32;

const transformDelegation = (
    delegation: CardanoCVoteRegistrationDelegation,
): PROTO.CardanoCVoteRegistrationDelegation => {
    // @ts-expect-error votingPublicKey is a legacy param kept for backward compatibility (for now)
    if (delegation.votingPublicKey) {
        console.warn('Please use votePublicKey instead of votingPublicKey.');
        // @ts-expect-error
        delegation.votePublicKey = delegation.votingPublicKey;
    }

    Assert(CardanoCVoteRegistrationDelegation, delegation);

    return {
        vote_public_key: delegation.votePublicKey,
        weight: delegation.weight,
    };
};

const transformCvoteRegistrationParameters = (
    cVoteRegistrationParameters: CardanoCVoteRegistrationParameters,
): PROTO.CardanoCVoteRegistrationParametersType => {
    // votingPublicKey and rewardAddressParameters
    // are legacy params kept for backward compatibility (for now)
    // @ts-expect-error
    if (cVoteRegistrationParameters.votingPublicKey) {
        console.warn('Please use votePublicKey instead of votingPublicKey.');
        // @ts-expect-error
        cVoteRegistrationParameters.votePublicKey = cVoteRegistrationParameters.votingPublicKey;
    }
    // @ts-expect-error
    if (cVoteRegistrationParameters.rewardAddressParameters) {
        console.warn('Please use paymentAddressParameters instead of rewardAddressParameters.');
        cVoteRegistrationParameters.paymentAddressParameters =
            // @ts-expect-error
            cVoteRegistrationParameters.rewardAddressParameters;
    }

    Assert(CardanoCVoteRegistrationParameters, cVoteRegistrationParameters);
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
        vote_public_key: cVoteRegistrationParameters.votePublicKey,
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
    Assert(CardanoAuxiliaryData, auxiliaryData);

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
