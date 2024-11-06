// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/CardanoGetAddress.js

import { Assert } from '@trezor/schema-utils';

import { AbstractMethod, MethodReturnType } from '../../../core/AbstractMethod';
import { getFirmwareRange } from '../../common/paramsValidator';
import { getMiscNetwork } from '../../../data/coinInfo';
import { fromHardened, getSerializedPath } from '../../../utils/pathUtils';
import {
    addressParametersFromProto,
    addressParametersToProto,
    modifyAddressParametersForBackwardsCompatibility,
    validateAddressParameters,
} from '../cardanoAddressParameters';
import { PROTO, ERRORS } from '../../../constants';
import { UI, createUiMessage } from '../../../events';
import { Bundle } from '../../../types';
import { CardanoGetAddress as CardanoGetAddressSchema } from '../../../types/api/cardano';

type Params = PROTO.CardanoGetAddress & {
    address?: string;
};

export default class CardanoGetAddress extends AbstractMethod<'cardanoGetAddress', Params[]> {
    hasBundle?: boolean;
    progress = 0;

    init() {
        this.noBackupConfirmationMode = 'always';
        this.requiredPermissions = ['read'];
        this.requiredDeviceCapabilities = ['Capability_Cardano'];
        this.firmwareRange = getFirmwareRange(
            this.name,
            getMiscNetwork('Cardano'),
            this.firmwareRange,
        );

        // create a bundle with only one batch if bundle doesn't exists
        this.hasBundle = !!this.payload.bundle;
        const payload = !this.payload.bundle
            ? { ...this.payload, bundle: [this.payload] }
            : this.payload;

        // validate bundle type
        Assert(Bundle(CardanoGetAddressSchema), payload);

        this.params = payload.bundle.map(batch => {
            validateAddressParameters(batch.addressParameters);

            return {
                address_parameters: addressParametersToProto(batch.addressParameters),
                address: batch.address,
                protocol_magic: batch.protocolMagic,
                network_id: batch.networkId,
                derivation_type:
                    typeof batch.derivationType !== 'undefined'
                        ? batch.derivationType
                        : PROTO.CardanoDerivationType.ICARUS_TREZOR,
                show_display: typeof batch.showOnTrezor === 'boolean' ? batch.showOnTrezor : true,
                chunkify: typeof batch.chunkify === 'boolean' ? batch.chunkify : false,
            };
        });

        const useEventListener =
            payload.useEventListener &&
            this.params.length === 1 &&
            typeof this.params[0].address === 'string' &&
            this.params[0].show_display;
        this.useUi = !useEventListener;
    }

    get info() {
        if (this.params.length === 1) {
            return `Export Cardano address for account #${
                fromHardened(this.params[0].address_parameters.address_n[2]) + 1
            }`;
        }

        return 'Export multiple Cardano addresses';
    }

    getButtonRequestData(code: string) {
        if (code === 'ButtonRequest_Address') {
            return {
                type: 'address' as const,
                serializedPath: getSerializedPath(
                    this.params[this.progress].address_parameters.address_n,
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

    async _call({
        address_parameters,
        protocol_magic,
        network_id,
        derivation_type,
        show_display,
        chunkify,
    }: Params) {
        const cmd = this.device.getCommands();
        const response = await cmd.typedCall('CardanoGetAddress', 'CardanoAddress', {
            address_parameters,
            protocol_magic,
            network_id,
            derivation_type,
            show_display,
            chunkify,
        });

        return response.message;
    }

    async run() {
        const responses: MethodReturnType<typeof this.name> = [];

        for (let i = 0; i < this.params.length; i++) {
            const batch = this.params[i];

            batch.address_parameters = modifyAddressParametersForBackwardsCompatibility(
                batch.address_parameters,
            );

            // silently get address and compare with requested address
            // or display as default inside popup
            if (batch.show_display) {
                const silent = await this._call({
                    ...batch,
                    show_display: false,
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
                addressParameters: addressParametersFromProto(batch.address_parameters),
                protocolMagic: batch.protocol_magic,
                networkId: batch.network_id,
                serializedPath: getSerializedPath(batch.address_parameters.address_n),
                serializedStakingPath: getSerializedPath(
                    batch.address_parameters.address_n_staking,
                ),
                address: response.address,
            });

            if (this.hasBundle) {
                // send progress
                this.postMessage(
                    createUiMessage(UI.BUNDLE_PROGRESS, {
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
