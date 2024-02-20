// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/GetAddress.js

import { AbstractMethod, MethodReturnType } from '../core/AbstractMethod';
import { validateCoinPath, getFirmwareRange } from './common/paramsValidator';
import { validatePath, getLabel, getSerializedPath } from '../utils/pathUtils';
import { getBitcoinNetwork, fixCoinInfoNetwork, getUniqueNetworks } from '../data/coinInfo';
import { PROTO, ERRORS } from '../constants';
import { UI, createUiMessage } from '../events';
import { Bundle, type BitcoinNetworkInfo } from '../types';
import { Assert } from '@trezor/schema-utils';
import { GetAddress as GetAddressSchema } from '../types/api/getAddress';

type Params = PROTO.GetAddress & {
    address?: string;
    coinInfo: BitcoinNetworkInfo;
    unlockPath?: PROTO.UnlockPath;
};

export default class GetAddress extends AbstractMethod<'getAddress', Params[]> {
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

        // Workaround to allow empty signature in multisig (issue #10841)
        payload?.bundle.forEach(bundleElement => {
            if (bundleElement.multisig && bundleElement.multisig?.signatures === undefined) {
                bundleElement.multisig.signatures = Array(
                    bundleElement.multisig?.pubkeys.length,
                ).fill('');
            }
        });
        // validate bundle type
        Assert(Bundle(GetAddressSchema), payload);

        this.params = payload.bundle.map(batch => {
            const path = validatePath(batch.path, 1);
            let coinInfo: BitcoinNetworkInfo | undefined;
            if (batch.coin) {
                coinInfo = getBitcoinNetwork(batch.coin);
            }

            if (coinInfo && !batch.crossChain) {
                validateCoinPath(path, coinInfo);
            } else if (!coinInfo) {
                coinInfo = getBitcoinNetwork(path);
            }

            if (!coinInfo) {
                throw ERRORS.TypedError('Method_UnknownCoin');
            } else if (coinInfo) {
                // set required firmware from coinInfo support
                this.firmwareRange = getFirmwareRange(this.name, coinInfo, this.firmwareRange);
            }

            // fix coinInfo network values (segwit/legacy)
            coinInfo = fixCoinInfoNetwork(coinInfo, path);

            return {
                address_n: path,
                address: batch.address,
                show_display: typeof batch.showOnTrezor === 'boolean' ? batch.showOnTrezor : true,
                multisig: batch.multisig,
                script_type: batch.scriptType,
                coinInfo,
                unlockPath: batch.unlockPath,
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
        // set info
        if (this.params.length === 1) {
            return getLabel('Export #NETWORK address', this.params[0].coinInfo);
        }
        const requestedNetworks = this.params.map(b => b.coinInfo);
        const uniqNetworks = getUniqueNetworks(requestedNetworks);
        if (uniqNetworks.length === 1 && uniqNetworks[0]) {
            return getLabel('Export multiple #NETWORK addresses', uniqNetworks[0]);
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

    async _call({
        address_n,
        show_display,
        multisig,
        script_type,
        coinInfo,
        unlockPath,
        chunkify,
    }: Params) {
        const cmd = this.device.getCommands();
        if (unlockPath) {
            await cmd.unlockPath(unlockPath);
        }

        return cmd.getAddress(
            {
                address_n,
                show_display,
                multisig,
                script_type,
                chunkify,
            },
            coinInfo,
        );
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
                    if (batch.address !== silent.address) {
                        throw ERRORS.TypedError('Method_AddressNotMatch');
                    }
                } else {
                    batch.address = silent.address;
                }
            }

            const response = await this._call(batch);
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
