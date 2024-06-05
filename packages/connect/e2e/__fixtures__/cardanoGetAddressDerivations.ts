/* eslint-disable @typescript-eslint/prefer-ts-expect-error */
// @ts-ignore
import commonFixtures from '../../../../submodules/trezor-common/tests/fixtures/cardano/get_base_address.derivations.json';

import { MessagesSchema } from '@trezor/protobuf';

const { CardanoAddressType, CardanoDerivationType } = MessagesSchema;

export default {
    method: 'cardanoGetAddress',
    setup: {
        mnemonic: commonFixtures.setup.mnemonic,
    },
    tests: commonFixtures.tests.flatMap(({ name, parameters, result }) => ({
        description: name,
        params: {
            addressParameters: {
                // @ts-expect-error loading untyped json
                addressType: CardanoAddressType[parameters.address_type.toUpperCase()],
                path: parameters.path,
                stakingPath: parameters.staking_path,
            },
            // @ts-expect-error loading untyped json
            derivationType: CardanoDerivationType[parameters.derivation_type],
            networkId: parameters.network_id,
            protocolMagic: parameters.protocol_magic,
        },
        result: {
            address: result.expected_address,
        },
    })),
};
