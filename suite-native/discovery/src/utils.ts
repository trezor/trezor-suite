import { A, G, pipe } from '@mobily/ts-belt';

import { DiscoveryItem } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';

import { DiscoveryDescriptorItem } from './types';
// This function will be removed in one of the following PRs, when `TrezorConnect.getAccountDescriptor` method is ready.
// see more: https://github.com/trezor/trezor-suite/issues/9658
export const fetchBundleDescriptors = async (bundle: DiscoveryItem[]) => {
    const { success, payload } = await TrezorConnect.getAccountDescriptor({
        bundle,
        skipFinalReload: true,
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
