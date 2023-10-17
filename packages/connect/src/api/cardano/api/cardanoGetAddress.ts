// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/CardanoGetAddress.js

import { AbstractMethod, MethodReturnType } from '../../../core/AbstractMethod';
import { validateParams, getFirmwareRange } from '../../common/paramsValidator';
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

type Params = PROTO.CardanoGetAddress & {
    address?: string;
};

export default class CardanoGetAddress extends AbstractMethod<'cardanoGetAddress', Params[]> {
    hasBundle?: boolean;
    progress = 0;
    confirmed?: boolean;

    init() {
        this.requiredPermissions = ['read'];
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
        validateParams(payload, [
            { name: 'bundle', type: 'array' },
            { name: 'useEventListener', type: 'boolean' },
        ]);

        this.params = payload.bundle.map(batch => {
            // validate incoming parameters for each batch
            validateParams(batch, [
                { name: 'addressParameters', type: 'object', required: true },
                { name: 'networkId', type: 'number', required: true },
                { name: 'protocolMagic', type: 'number', required: true },
                { name: 'derivationType', type: 'number' },
                { name: 'address', type: 'string' },
                { name: 'showOnTrezor', type: 'boolean' },
                { name: 'chunkify', type: 'boolean' },
            ]);

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
        this.confirmed = useEventListener;
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

    async confirmation() {
        if (this.confirmed) return true;
        // wait for popup window
        await this.getPopupPromise().promise;
        // initialize user response promise
        const uiPromise = this.createUiPromise(UI.RECEIVE_CONFIRMATION);

        // request confirmation view
        this.postMessage(
            createUiMessage(UI.REQUEST_CONFIRMATION, {
                view: 'export-address',
                label: this.info,
            }),
        );

        // wait for user action
        const uiResp = await uiPromise.promise;

        this.confirmed = uiResp.payload;
        return this.confirmed;
    }

    async noBackupConfirmation() {
        // wait for popup window
        await this.getPopupPromise().promise;
        // initialize user response promise
        const uiPromise = this.createUiPromise(UI.RECEIVE_CONFIRMATION);

        // request confirmation view
        this.postMessage(
            createUiMessage(UI.REQUEST_CONFIRMATION, {
                view: 'no-backup',
            }),
        );

        // wait for user action
        const uiResp = await uiPromise.promise;
        return uiResp.payload;
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

    _ensureFirmwareSupportsBatch(batch: Params) {
        const SCRIPT_ADDRESSES_TYPES = [
            PROTO.CardanoAddressType.BASE_SCRIPT_KEY,
            PROTO.CardanoAddressType.BASE_KEY_SCRIPT,
            PROTO.CardanoAddressType.BASE_SCRIPT_SCRIPT,
            PROTO.CardanoAddressType.POINTER_SCRIPT,
            PROTO.CardanoAddressType.ENTERPRISE_SCRIPT,
            PROTO.CardanoAddressType.REWARD_SCRIPT,
        ];

        if (SCRIPT_ADDRESSES_TYPES.includes(batch.address_parameters.address_type)) {
            if (!this.device.atLeast(['0', '2.4.3'])) {
                throw ERRORS.TypedError(
                    'Method_InvalidParameter',
                    `Address type not supported by device firmware`,
                );
            }
        }
    }

    async run() {
        const responses: MethodReturnType<typeof this.name> = [];

        for (let i = 0; i < this.params.length; i++) {
            const batch = this.params[i];

            this._ensureFirmwareSupportsBatch(batch);
            batch.address_parameters = modifyAddressParametersForBackwardsCompatibility(
                this.device,
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
