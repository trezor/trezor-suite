import type { ComponentType } from 'react';

export type NativeNetworkAccountDetailBannerComponent = ComponentType;

export type NativeNetworkAccountDetailBanner = {
    id: string;
    component: NativeNetworkAccountDetailBannerComponent;
};

export type NativeNetworkAccountDetailBanners = readonly NativeNetworkAccountDetailBanner[];
