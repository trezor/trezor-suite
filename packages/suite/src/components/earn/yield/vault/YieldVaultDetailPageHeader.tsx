import { useGetVaultByAddress } from '@suite-common/earn-stablecoin-api';
import { getNetworkOptional } from '@suite-common/wallet-config';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';

import { useEarnRouteAccount } from '#src/components/earn/utils/useEarnRouteAccount';
import { YieldPageHeader } from '#src/components/earn/yield/common/YieldPageHeader';

export const YieldVaultDetailPageHeader = () => {
    const { account, routeParams } = useEarnRouteAccount();

    const vaultAddress = routeParams?.vaultAddress
        ? getContractAddressForNetworkSymbol(routeParams.symbol, routeParams.vaultAddress)
        : undefined;

    const { data: vault } = useGetVaultByAddress({
        enabled: !!vaultAddress,
        outputToken: vaultAddress,
        network: getNetworkOptional(routeParams?.symbol)?.yieldXyzId ?? undefined,
    });

    return (
        <YieldPageHeader
            analyticsStep="vault-detail"
            fallbackTitleId="TR_EARN_DEFI_YIELD"
            account={account}
            routeParams={routeParams}
            vault={vault ?? undefined}
            isInvalid={!account || !vault}
        />
    );
};
