import type { Reducer } from '@reduxjs/toolkit';

import type { NetworkSymbol } from '@trezor/network-module-types';

import type { NativeNetworkAccountDetailBanners } from './NativeNetworkAccountDetailBanner';

export type SuiteNativeNetworkModule = {
    getSupportedNetworks: () => readonly NetworkSymbol[];
    accountDetailBanners: NativeNetworkAccountDetailBanners;
    reducer: {
        key: string;
        reducer: Reducer;
    };
};
