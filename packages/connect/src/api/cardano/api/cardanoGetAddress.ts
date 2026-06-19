// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/CardanoGetAddress.js

import {
    Bundle,
    CardanoGetAddress as CardanoGetAddressSchema,
    type PermissionRequest,
    UI_REQUEST,
    createUiMessage,
} from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { fromHardenedPathPart } from '@trezor/crypto-utils';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodContext, MethodMessage, MethodReturnType } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getMiscNetwork } from '../../../data/coinInfo';
import { getSerializedPath } from '../../../utils/pathUtils';
import { bundlify } from '../../common/paramsValidator';
import {
    addressParametersFromProto,
    addressParametersToProto,
    modifyAddressParametersForBackwardsCompatibility,
    validateAddressParameters,
} from '../cardanoAddressParameters';

type Params = {
    proto: PROTO.CardanoGetAddress;
    address?: string;
};

export default class CardanoGetAddress extends AbstractMethod<'cardanoGetAddress', Params[]> {
    hasBundle?: boolean;
    progress = 0;

    constructor(message: MethodMessage<'cardanoGetAddress'>) {
        const { hasBundle, payload } = bundlify(message.payload);

        // validate bundle type
        Assert(Bundle(CardanoGetAddressSchema), payload);

        const params = payload.bundle.map(batch => {
            validateAddressParameters(batch.addressParameters);

            const proto = {
                address_parameters: addressParametersToProto(batch.addressParameters),
                protocol_magic: batch.protocolMagic,
                network_id: batch.networkId,
                derivation_type:
                    typeof batch.derivationType !== 'undefined'
                        ? batch.derivationType
                        : PROTO.CardanoDerivationType.ICARUS_TREZOR,
                show_display: typeof batch.showOnTrezor === 'boolean' ? batch.showOnTrezor : true,
                chunkify: typeof batch.chunkify === 'boolean' ? batch.chunkify : false,
            };

            return { proto, address: batch.address };
        });

        super(message, params);

        this.hasBundle = hasBundle;
        this.confirmMissingBackup = true;
        this.requiredDeviceCapabilities = ['Capability_Cardano'];
        this.requiredFirmwareCoins = [getMiscNetwork('Cardano')];
    }

    get requiredPermissions(): PermissionRequest[] {
        return this.coinPerms('read_address', this.requiredFirmwareCoins);
    }

    get info() {
        if (this.params.length === 1) {
            const { params } = this;
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const first: (typeof params)[number] = params[0];

            const addressN = first.proto.address_parameters.address_n;
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const accountIndex: number = addressN[2];

            return `Export Cardano address for account #${fromHardenedPathPart(accountIndex) + 1}`;
        }

        return 'Export multiple Cardano addresses';
    }

    getButtonRequestData(code: string) {
        if (code === 'ButtonRequest_Address') {
            const { params } = this;
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const current: (typeof params)[number] = params[this.progress];

            return {
                type: 'address' as const,
                serializedPath: getSerializedPath(current.proto.address_parameters.address_n),
                address: current.address || 'not-set',
            };
        }
    }

    get confirmation() {
        return !this.useUi
            ? undefined
            : {
                  view: 'export-address' as const,
                  label: this.info,
              };
    }

    async _call({ proto }: Params) {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('CardanoGetAddress', 'CardanoAddress', proto);

        return response.message;
    }

    async run({ sendCoreMessage }: MethodContext) {
        const responses: MethodReturnType<typeof this.name> = [];

        for (let i = 0; i < this.params.length; i++) {
            const { params } = this;
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const batch: (typeof params)[number] = params[i];

            batch.proto.address_parameters = modifyAddressParametersForBackwardsCompatibility(
                batch.proto.address_parameters,
            );

            // silently get address and compare with requested address
            // or display as default inside popup
            if (batch.proto.show_display) {
                const silent = await this._call({
                    ...batch,
                    proto: { ...batch.proto, show_display: false },
                });
                if (typeof batch.address === 'string') {
                    if (batch.address !== silent.address) {
                        throw ERRORS.TypedError('Method_AddressNotMatch');
                    }
                } else {
                    batch.address = silent.address;
                }
            }

            const response = await this._call(batch);

            responses.push({
                addressParameters: addressParametersFromProto(batch.proto.address_parameters),
                protocolMagic: batch.proto.protocol_magic,
                networkId: batch.proto.network_id,
                serializedPath: getSerializedPath(batch.proto.address_parameters.address_n),
                serializedStakingPath: getSerializedPath(
                    batch.proto.address_parameters.address_n_staking,
                ),
                address: response.address,
                mac: response.mac,
            });

            if (this.hasBundle) {
                // send progress
                sendCoreMessage(
                    createUiMessage(UI_REQUEST.BUNDLE_PROGRESS, {
                        total: this.params.length,
                        progress: i,
                        response,
                    }),
                );
            }

            this.progress++;
        }

        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const first: (typeof responses)[number] = responses[0];

        return this.hasBundle ? responses : first;
    }
}
