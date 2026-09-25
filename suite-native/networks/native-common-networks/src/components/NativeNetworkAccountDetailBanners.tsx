import { useServices } from '@suite-common/dependency-injection';
import type { NetworkSymbol } from '@suite-common/networks';

import { injectNativeNetworks } from '../NativeNetworksServices';

type NativeNetworkAccountDetailBannersProps = {
    networkSymbol: NetworkSymbol;
};

export const NativeNetworkAccountDetailBanners = ({
    networkSymbol,
}: NativeNetworkAccountDetailBannersProps) => {
    const { nativeNetworks } = useServices(injectNativeNetworks);
    const accountDetailBanners = nativeNetworks.getAccountDetailBanners(networkSymbol);

    return accountDetailBanners.map(({ id, component: AccountDetailBanner }) => (
        <AccountDetailBanner key={id} />
    ));
};
