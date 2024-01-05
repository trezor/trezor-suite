// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/helpers/cardanoAddressParameters.js

import { validatePath } from '../../utils/pathUtils';
import { PROTO, ERRORS } from '../../constants';
import type { Device } from '../../device/Device';
import { CardanoAddressParameters } from '../../types/api/cardano';
import { Assert } from '@trezor/schema-utils';

export const validateAddressParameters = (addressParameters: CardanoAddressParameters) => {
    Assert(CardanoAddressParameters, addressParameters);

    if (addressParameters.path) {
        validatePath(addressParameters.path);
    }
    if (addressParameters.stakingPath) {
        validatePath(addressParameters.stakingPath);
    }
};

export const modifyAddressParametersForBackwardsCompatibility = (
    device: Device,
    address_parameters: PROTO.CardanoAddressParametersType,
): PROTO.CardanoAddressParametersType => {
    if (address_parameters.address_type === PROTO.CardanoAddressType.REWARD) {
        // older firmware expects reward address path in path field instead of staking path
        let { address_n, address_n_staking } = address_parameters;

        if (address_n.length > 0 && address_n_staking.length > 0) {
            throw ERRORS.TypedError(
                'Method_InvalidParameter',
                `Only stakingPath is allowed for CardanoAddressType.REWARD`,
            );
        }

        if (device.atLeast(['0', '2.4.3'])) {
            if (address_n.length > 0) {
                address_n_staking = address_n;
                address_n = [];
            }
        } else if (address_n_staking.length > 0) {
            address_n = address_n_staking;
            address_n_staking = [];
        }

        return {
            ...address_parameters,
            address_n,
            address_n_staking,
        };
    }

    return address_parameters;
};

export const addressParametersToProto = (
    addressParameters: CardanoAddressParameters,
): PROTO.CardanoAddressParametersType => {
    let path: number[] = [];
    if (addressParameters.path) {
        path = validatePath(addressParameters.path, 3);
    }

    let stakingPath: number[] = [];
    if (addressParameters.stakingPath) {
        stakingPath = validatePath(addressParameters.stakingPath, 3);
    }

    let certificatePointer;
    if (addressParameters.certificatePointer) {
        certificatePointer = {
            block_index: addressParameters.certificatePointer.blockIndex,
            tx_index: addressParameters.certificatePointer.txIndex,
            certificate_index: addressParameters.certificatePointer.certificateIndex,
        };
    }

    return {
        address_type: addressParameters.addressType,
        address_n: path,
        address_n_staking: stakingPath,
        staking_key_hash: addressParameters.stakingKeyHash,
        certificate_pointer: certificatePointer,
        script_payment_hash: addressParameters.paymentScriptHash,
        script_staking_hash: addressParameters.stakingScriptHash,
    };
};

export const addressParametersFromProto = (
    addressParameters: PROTO.CardanoAddressParametersType,
): CardanoAddressParameters => {
    let certificatePointer;
    if (addressParameters.certificate_pointer) {
        certificatePointer = {
            blockIndex: addressParameters.certificate_pointer.block_index,
            txIndex: addressParameters.certificate_pointer.tx_index,
            certificateIndex: addressParameters.certificate_pointer.certificate_index,
        };
    }

    return {
        addressType: addressParameters.address_type,
        path: addressParameters.address_n,
        stakingPath: addressParameters.address_n_staking,
        stakingKeyHash: addressParameters.staking_key_hash,
        certificatePointer,
    };
};
