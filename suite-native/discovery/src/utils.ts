import { NetworkType } from '@suite-common/wallet-config';
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
export const getBundleDescriptors = async (
    bundle: DiscoveryItem[],
    networkType: NetworkType,
): Promise<DiscoveryDescriptorItem[]> => {
    if (networkType === 'bitcoin') {
        const { success, payload } = await TrezorConnect.getPublicKey({
            bundle,
        });
        if (success)
            return payload.map(({ xpubSegwit, xpub }, index) => ({
                ...bundle[index],
                descriptor: xpubSegwit ?? xpub,
            }));
    } else if (networkType === 'ethereum') {
        const { success, payload } = await TrezorConnect.ethereumGetAddress({
            bundle,
        });
        if (success)
            return payload.map(({ address }, index) => ({
                ...bundle[index],
                descriptor: address,
            }));
    } else if (networkType === 'cardano') {
        const { success, payload } = await TrezorConnect.cardanoGetPublicKey({
            bundle,
        });
        if (success)
            return payload.map(({ publicKey }, index) => ({
                ...bundle[index],
                descriptor: publicKey,
            }));
    }

    return [];
};
