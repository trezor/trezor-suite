import { useServices } from '@suite-common/dependency-injection';
import type { NetworkSymbol } from '@suite-common/networks';
import type { NativeNetworkAccountDetailBannerProps as RegisteredBannerProps } from '@suite-native/network-module-suite-native-types';

import { injectNativeNetworks } from '../NativeNetworksServices';

type NativeNetworkAccountDetailBannersProps = RegisteredBannerProps & {
    networkSymbol: NetworkSymbol;
};

export const NativeNetworkAccountDetailBanners = ({
    networkSymbol,
    accountKey,
    tokenContract,
}: NativeNetworkAccountDetailBannersProps) => {
    const { nativeNetworks } = useServices(injectNativeNetworks);
    const accountDetailBanners = nativeNetworks.getAccountDetailBanners(networkSymbol);

    return accountDetailBanners.map(({ id, component: AccountDetailBanner }) => (
        <AccountDetailBanner key={id} accountKey={accountKey} tokenContract={tokenContract} />
    ));
};
