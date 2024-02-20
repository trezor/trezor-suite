// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/EthereumGetAddress.js

import { AbstractMethod, MethodReturnType } from '../../../core/AbstractMethod';
import { getFirmwareRange } from '../../common/paramsValidator';
import { validatePath, getSerializedPath, getSlip44ByPath } from '../../../utils/pathUtils';
import { getNetworkLabel } from '../../../utils/ethereumUtils';
import { getEthereumNetwork, getUniqueNetworks } from '../../../data/coinInfo';
import { stripHexPrefix } from '../../../utils/formatUtils';
import { PROTO, ERRORS } from '../../../constants';
import { UI, createUiMessage } from '../../../events';
import type { EthereumNetworkInfo } from '../../../types';
import {
    getEthereumDefinitions,
    decodeEthereumDefinition,
    ethereumNetworkInfoFromDefinition,
} from '../ethereumDefinitions';
import { Assert } from '@trezor/schema-utils';
import { Bundle } from '../../../types';
import { GetAddress as GetAddressSchema } from '../../../types/api/getAddress';

type Params = PROTO.EthereumGetAddress & {
    address?: string;
    network?: EthereumNetworkInfo;
    encoded_network?: ArrayBuffer;
};

export default class EthereumGetAddress extends AbstractMethod<'ethereumGetAddress', Params[]> {
    hasBundle?: boolean;
    progress = 0;
    confirmed?: boolean;

    init() {
        this.requiredPermissions = ['read'];

        // create a bundle with only one batch if bundle doesn't exists
        this.hasBundle = !!this.payload.bundle;
        const payload = !this.payload.bundle
            ? { ...this.payload, bundle: [this.payload] }
            : this.payload;

        // validate bundle type
        Assert(Bundle(GetAddressSchema), payload);

        this.params = payload.bundle.map(batch => {
            const path = validatePath(batch.path, 3);
            const network = getEthereumNetwork(path);
            this.firmwareRange = getFirmwareRange(this.name, network, this.firmwareRange);

            return {
                address_n: path,
                show_display: typeof batch.showOnTrezor === 'boolean' ? batch.showOnTrezor : true,
                address: batch.address,
                network,
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

    async initAsync(): Promise<void> {
        for (let i = 0; i < this.params.length; i++) {
            // network was maybe already set from 'well-known' definition in init method.
            if (!this.params[i].network) {
                const slip44 = getSlip44ByPath(this.params[i].address_n);

                const definitions = await getEthereumDefinitions({
                    slip44,
                });

                const decoded = decodeEthereumDefinition(definitions);
                if (decoded.network) {
                    this.params[i].network = ethereumNetworkInfoFromDefinition(decoded.network);
                }
                if (definitions.encoded_network) {
                    this.params[i].encoded_network = definitions.encoded_network;
                }
            }
        }
    }

    get info() {
        if (this.params.length === 1) {
            return getNetworkLabel('Export #NETWORK address', this.params[0].network);
        }
        const requestedNetworks = this.params.map(b => b.network);
        const uniqNetworks = getUniqueNetworks(requestedNetworks);
        if (uniqNetworks.length === 1 && uniqNetworks[0]) {
            return getNetworkLabel('Export multiple #NETWORK addresses', uniqNetworks[0]);
        }

        return 'Export multiple addresses';
    }

    getButtonRequestData(code: string) {
        if (code === 'ButtonRequest_Address') {
            return {
                type: 'address' as const,
                serializedPath: getSerializedPath(this.params[this.progress].address_n),
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

    _call({ address_n, show_display, encoded_network, chunkify }: Params) {
        const cmd = this.device.getCommands();

        return cmd.ethereumGetAddress({
            address_n,
            show_display,
            encoded_network,
            chunkify,
        });
    }

    async run() {
        const responses: MethodReturnType<typeof this.name> = [];

        for (let i = 0; i < this.params.length; i++) {
            const batch = this.params[i];

            // silently get address and compare with requested address
            // or display as default inside popup
            if (batch.show_display) {
                const silent = await this._call({
                    ...batch,
                    show_display: false,
                });
                if (typeof batch.address === 'string') {
                    if (
                        stripHexPrefix(batch.address).toLowerCase() !==
                        stripHexPrefix(silent.address).toLowerCase()
                    ) {
                        throw ERRORS.TypedError('Method_AddressNotMatch');
                    }
                } else {
                    // save address for future verification in "getButtonRequestData"
                    batch.address = silent.address;
                }
            }

            const response = await this._call({
                ...batch,
            });
            responses.push(response);

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
