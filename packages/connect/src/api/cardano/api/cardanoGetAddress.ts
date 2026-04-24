// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/CardanoGetAddress.js

import { Bundle, CardanoGetAddress as CardanoGetAddressSchema } from '@trezor/connect-common';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { getMiscNetwork } from '../../../data/coinInfo';
import { fromHardened, getSerializedPath } from '../../../utils/pathUtils';
import { AbstractGetAddress } from '../../common/AbstractGetAddress';
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

type RunResponse = {
    addressParameters: ReturnType<typeof addressParametersFromProto>;
    protocolMagic: number;
    networkId: number;
    serializedPath: string;
    serializedStakingPath: string;
    address: string;
    mac?: string;
};

export default class CardanoGetAddress extends AbstractGetAddress<
    'cardanoGetAddress',
    Params,
    RunResponse
> {
    constructor(message: MethodMessage<'cardanoGetAddress'>) {
        const { hasBundle, payload } = bundlify(message.payload);

        Assert(Bundle(CardanoGetAddressSchema), payload);

        const params: Params[] = payload.bundle.map(batch => {
            validateAddressParameters(batch.addressParameters);

            return {
                proto: {
                    address_parameters: addressParametersToProto(batch.addressParameters),
                    protocol_magic: batch.protocolMagic,
                    network_id: batch.networkId,
                    derivation_type:
                        typeof batch.derivationType !== 'undefined'
                            ? batch.derivationType
                            : PROTO.CardanoDerivationType.ICARUS_TREZOR,
                    show_display:
                        typeof batch.showOnTrezor === 'boolean' ? batch.showOnTrezor : true,
                    chunkify: typeof batch.chunkify === 'boolean' ? batch.chunkify : false,
                },
                address: batch.address,
            };
        });

        super(message, params);

        this.hasBundle = hasBundle;
        this.useUi = this.getUseUi(this.params, payload.useEventListener);
        this.confirmMissingBackup = true;
        this.requiredDeviceCapabilities = ['Capability_Cardano'];
        this.requiredFirmwareCoins = [getMiscNetwork('Cardano')];
    }

    get info() {
        if (this.params.length === 1) {
            return `Export Cardano address for account #${
                fromHardened(this.params[0].proto.address_parameters.address_n[2]) + 1
            }`;
        }

        return 'Export multiple Cardano addresses';
    }

    get confirmation() {
        return !this.useUi
            ? undefined
            : {
                  view: 'export-address' as const,
                  label: this.info,
              };
    }

    protected getAddressN(param: Params) {
        return param.proto.address_parameters.address_n;
    }

    protected getShowDisplay(param: Params) {
        return param.proto.show_display ?? false;
    }

    protected paramForSilent(param: Params) {
        return { ...param, proto: { ...param.proto, show_display: false } };
    }

    protected getPreviousAddress(param: Params) {
        return param.address;
    }

    protected setPreviousAddress(param: Params, address: string) {
        param.address = address;
    }

    protected preProcessBatch(param: Params) {
        param.proto.address_parameters = modifyAddressParametersForBackwardsCompatibility(
            param.proto.address_parameters,
        );
    }

    async _call({ proto }: Params) {
        const cmd = this.getDevice().getCommands();
        const response = await cmd.typedCall('CardanoGetAddress', 'CardanoAddress', proto);

        return response.message;
    }

    protected buildRunResponse(
        param: Params,
        response: { address: string; mac?: string },
    ): RunResponse {
        return {
            addressParameters: addressParametersFromProto(param.proto.address_parameters),
            protocolMagic: param.proto.protocol_magic,
            networkId: param.proto.network_id,
            serializedPath: getSerializedPath(param.proto.address_parameters.address_n),
            serializedStakingPath: getSerializedPath(
                param.proto.address_parameters.address_n_staking,
            ),
            address: response.address,
            mac: response.mac,
        };
    }
}
