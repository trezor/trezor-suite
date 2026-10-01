import type { Reducer } from '@reduxjs/toolkit';

import type { NetworkSymbol } from '@trezor/network-module-types';

import type { NativeNetworkAccountDetailBanners } from './NativeNetworkAccountDetailBanner';
import type { NativeNetworkReducerKey } from './NativeNetworkReducerKey';
import type { NativeNetworkSendFormComponent } from './NativeNetworkSendForm';

export type SuiteNativeNetworkModule = {
    getSupportedNetworks: () => readonly NetworkSymbol[];
    getSendForm?: () => NativeNetworkSendFormComponent;
    accountDetailBanners: NativeNetworkAccountDetailBanners;
    reducer?: {
        /** Unique state namespace used to mount the module reducer under native network state. */
        key: NativeNetworkReducerKey;
        reducer: Reducer;
    };
};
