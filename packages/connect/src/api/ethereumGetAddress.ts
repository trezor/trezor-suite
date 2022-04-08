// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/EthereumGetAddress.js

import { AbstractMethod, MethodReturnType } from '../core/AbstractMethod';
import { validateParams, getFirmwareRange } from './common/paramsValidator';
import { validatePath, getSerializedPath } from '../utils/pathUtils';
import { getNetworkLabel } from '../utils/ethereumUtils';
import { getEthereumNetwork, getUniqueNetworks } from '../data/CoinInfo';
import { stripHexPrefix } from '../utils/formatUtils';
import { PROTO, ERRORS } from '../constants';
import { UI, UiMessage } from '../events';
import type { EthereumNetworkInfo } from '../types';

type Params = PROTO.EthereumGetAddress & {
    address?: string;
    network?: EthereumNetworkInfo;
};

export default class EthereumGetAddress extends AbstractMethod<'ethereumGetAddress'> {
    params: Params[] = [];

    hasBundle: boolean;

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
        validateParams(payload, [
            { name: 'bundle', type: 'array' },
            { name: 'useEventListener', type: 'boolean' },
        ]);

        payload.bundle.forEach(batch => {
            // validate incoming parameters for each batch
            validateParams(batch, [
                { name: 'path', required: true },
                { name: 'address', type: 'string' },
                { name: 'showOnTrezor', type: 'boolean' },
            ]);

            const path = validatePath(batch.path, 3);
            const network = getEthereumNetwork(path);
            this.firmwareRange = getFirmwareRange(this.name, network, this.firmwareRange);

            this.params.push({
                address_n: path,
                show_display: typeof batch.showOnTrezor === 'boolean' ? batch.showOnTrezor : true,
                address: batch.address,
                network,
            });
        });

        // set info
        if (this.params.length === 1) {
            this.info = getNetworkLabel('Export #NETWORK address', this.params[0].network);
        } else {
            const requestedNetworks = this.params.map(b => b.network);
            const uniqNetworks = getUniqueNetworks(requestedNetworks);
            if (uniqNetworks.length === 1 && uniqNetworks[0]) {
                this.info = getNetworkLabel('Export multiple #NETWORK addresses', uniqNetworks[0]);
            } else {
                this.info = 'Export multiple addresses';
            }
        }

        const useEventListener =
            payload.useEventListener &&
            this.params.length === 1 &&
            typeof this.params[0].address === 'string' &&
            this.params[0].show_display;
        this.confirmed = useEventListener;
        this.useUi = !useEventListener;
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
        const uiPromise = this.createUiPromise(UI.RECEIVE_CONFIRMATION, this.device);

        // request confirmation view
        this.postMessage(
            UiMessage(UI.REQUEST_CONFIRMATION, {
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
        const uiPromise = this.createUiPromise(UI.RECEIVE_CONFIRMATION, this.device);

        // request confirmation view
        this.postMessage(
            UiMessage(UI.REQUEST_CONFIRMATION, {
                view: 'no-backup',
            }),
        );

        // wait for user action
        const uiResp = await uiPromise.promise;
        return uiResp.payload;
    }

    _call({ address_n, show_display }: Params) {
        const cmd = this.device.getCommands();
        return cmd.ethereumGetAddress({
            address_n,
            show_display,
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

            const response = await this._call(batch);
            responses.push(response);

            if (this.hasBundle) {
                // send progress
                this.postMessage(
                    UiMessage(UI.BUNDLE_PROGRESS, {
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
