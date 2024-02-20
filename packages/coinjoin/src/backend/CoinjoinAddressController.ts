/* eslint no-underscore-dangle: ["error", { "allowAfterThis": true }] */

import type { Network } from '@trezor/utxo-lib';

import { deriveAddresses } from './backendUtils';
import { getAddressScript } from './filters';
import type { AccountAddress, ScanAccountCheckpoint, AccountCache } from '../types/backend';
import { DISCOVERY_LOOKOUT, DISCOVERY_LOOKOUT_EXTENDED } from '../constants';

export type AddressController = Pick<CoinjoinAddressController, 'receive' | 'change' | 'analyze'>;

export class CoinjoinAddressController {
    private readonly xpub;
    private readonly network;
    private readonly lookouts;
    private readonly cache;

    private readonly _receive;
    private readonly _change;

    get receive() {
        return this._receive;
    }

    get change() {
        return this._change;
    }

    constructor(
        xpub: string,
        network: Network,
        { receiveCount, changeCount }: ScanAccountCheckpoint,
        cache?: AccountCache,
        { receiveLookout, changeLookout } = {
            receiveLookout: DISCOVERY_LOOKOUT,
            changeLookout: DISCOVERY_LOOKOUT_EXTENDED,
        },
    ) {
        this.xpub = xpub;
        this.network = network;
        this.lookouts = { receiveLookout, changeLookout };
        this.cache = cache;
        this._receive = this.deriveMore('receive', 0, receiveCount);
        this._change = this.deriveMore('change', 0, changeCount);
    }

    private deriveMore(type: 'receive' | 'change', from: number, count: number) {
        const prederived = this.cache?.[`${type}Prederived`];

        return deriveAddresses(prederived, this.xpub, type, from, count, this.network).map(
            ({ address, path }) => ({
                address,
                path,
                script: getAddressScript(address, this.network),
            }),
        );
    }

    analyze<T>(getTxs: (address: AccountAddress) => T[], onTxs?: (txs: T[]) => void) {
        return {
            receive: this.analyzeType('receive', getTxs, onTxs),
            change: this.analyzeType('change', getTxs, onTxs),
        };
    }

    private analyzeType<T>(
        type: 'receive' | 'change',
        getTxs: (address: AccountAddress) => T[],
        onTxs?: (txs: T[]) => void,
    ) {
        const derived = this[`_${type}`];
        const lookout = this.lookouts[`${type}Lookout`];

        const start = derived.length;

        for (let i = 0; i < derived.length; ++i) {
            const txs = getTxs(derived[i]);
            if (txs.length) {
                onTxs?.(txs);
                const missing = lookout + i + 1 - derived.length;
                if (missing > 0) {
                    derived.push(...this.deriveMore(type, derived.length, missing));
                }
            }
        }

        return derived.slice(start);
    }
}
