import type { ComponentType } from 'react';

import type { AccountKey, TokenAddress } from '@suite-common/wallet-types';

export type NativeNetworkAccountDetailBannerProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

export type NativeNetworkAccountDetailBannerComponent =
    ComponentType<NativeNetworkAccountDetailBannerProps>;

export type NativeNetworkAccountDetailBanner = {
    id: string;
    component: NativeNetworkAccountDetailBannerComponent;
};

export type NativeNetworkAccountDetailBanners = readonly NativeNetworkAccountDetailBanner[];
