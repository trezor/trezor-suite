import { A, G, pipe } from '@mobily/ts-belt';

import { DiscoveryItem } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';

import { DiscoveryDescriptorItem } from './types';

/**
 * Used to handle concurrent read-access to the connected device.
 */
export class DeviceAccessMutex {
    isLocked: boolean;
    taskQueue: ((value: unknown) => void)[];
    constructor() {
        this.isLocked = false;
        this.taskQueue = [];
    }

    lock() {
        if (this.isLocked) {
            return new Promise(resolve => {
                this.taskQueue.push(resolve);
            });
        }
        this.isLocked = true;
        return Promise.resolve();
    }

    unlock() {
        const resolve = this.taskQueue.shift();
        if (resolve) {
            resolve?.(null);
        } else {
            this.isLocked = false;
        }
    }
}

// This function will be removed in one of the following PRs, when `TrezorConnect.getAccountDescriptor` method is ready.
// see more: https://github.com/trezor/trezor-suite/issues/9658
export const fetchBundleDescriptors = async (bundle: DiscoveryItem[]) => {
    const { success, payload } = await TrezorConnect.getAccountDescriptor({
        bundle,
    });

    if (success && payload)
        return pipe(
            payload,
            A.filter(G.isNotNullable),
            A.map(bundleItem => bundleItem.descriptor),
            A.zipWith(bundle, (descriptor, bundleItem) => ({ ...bundleItem, descriptor })),
        ) as DiscoveryDescriptorItem[];

    return [];
};
