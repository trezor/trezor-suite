// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/CardanoGetAddress.js

import {
    Bundle,
    CardanoGetAddress as CardanoGetAddressSchema,
    UI_REQUEST,
    createUiMessage,
} from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type {
    MethodContext,
    MethodMessage,
    MethodPermission,
    MethodReturnType,
} from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getMiscNetwork } from '../../../data/coinInfo';
import { fromHardened, getSerializedPath } from '../../../utils/pathUtils';
import { getFirmwareRange } from '../../common/paramsValidator';
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
        super(message);
        this.confirmMissingBackup = true;
        this.requiredDeviceCapabilities = ['Capability_Cardano'];
        this.firmwareRange = getFirmwareRange(
            this.name,
            getMiscNetwork('Cardano'),
            this.firmwareRange,
        );
    }

    get requiredPermissions(): MethodPermission[] {
        return ['read'];
    }

    init() {
        // create a bundle with only one batch if bundle doesn't exists
        this.hasBundle = !!this.payload.bundle;
        const payload = !this.payload.bundle
            ? { ...this.payload, bundle: [this.payload] }
            : this.payload;

        // validate bundle type
        Assert(Bundle(CardanoGetAddressSchema), payload);

        this.params = payload.bundle.map(batch => {
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

        this.useUi = this.getUseUi(this.params);
    }

    get info() {
        if (this.params.length === 1) {
            return `Export Cardano address for account #${
                fromHardened(this.params[0].proto.address_parameters.address_n[2]) + 1
            }`;
        }

        return 'Export multiple Cardano addresses';
    }

    getButtonRequestData(code: string) {
        if (code === 'ButtonRequest_Address') {
            return {
                type: 'address' as const,
                serializedPath: getSerializedPath(
                    this.params[this.progress].proto.address_parameters.address_n,
                ),
                address: this.params[this.progress].address || 'not-set',
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
            const batch = this.params[i];

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

        return this.hasBundle ? responses : responses[0];
    }
}
