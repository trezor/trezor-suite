import type { Network } from '@trezor/utxo-lib';

import { deriveAddresses } from './backendUtils';
import { getBlockAddressScript } from './filters';
import type { PrederivedAddress, AccountAddress } from '../types/backend';

type BareAddress = {
    address: string;
};

export interface AddressController {
    addresses: BareAddress[];
    analyze<T>(
        getTxs: (address: BareAddress) => Promise<T[]>,
        onTxs?: (txs: T[]) => void,
    ): Promise<void>;
    analyze<T>(getTxs: (address: BareAddress) => T[], onTxs?: (txs: T[]) => void): void;
}

export class CoinjoinAddressController implements AddressController {
    private readonly deriveMore;
    private readonly lookout;
    private readonly derived;

    get addresses() {
        return this.derived;
    }

    constructor(
        xpub: string,
        type: 'receive' | 'change',
        lookout: number,
        network: Network,
        initialCount: number,
        prederived?: PrederivedAddress[],
    ) {
        this.lookout = lookout;
        this.deriveMore = (from: number, count: number) =>
            deriveAddresses(prederived, xpub, type, from, count, network).map(
                ({ address, path }) => ({
                    address,
                    path,
                    script: getBlockAddressScript(address, network),
                }),
            );
        this.derived = this.deriveMore(0, initialCount);
    }

    async analyze<T>(
        getTxs: (address: AccountAddress) => T[] | Promise<T[]>,
        onTxs?: (txs: T[]) => void,
    ) {
        for (let i = 0; i < this.derived.length; ++i) {
            const maybePromise = getTxs(this.derived[i]);
            // eslint-disable-next-line no-await-in-loop
            const txs = 'then' in maybePromise ? await maybePromise : maybePromise;
            if (txs.length) {
                onTxs?.(txs);
                const missing = this.lookout + i + 1 - this.derived.length;
                if (missing > 0) {
                    this.derived.push(...this.deriveMore(this.derived.length, missing));
                }
            }
        }
    }
}
