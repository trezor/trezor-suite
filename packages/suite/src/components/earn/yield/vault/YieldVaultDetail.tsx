import { useGetVaultByAddress } from '@suite-common/earn-stablecoin-api';
import { getNetworkOptional } from '@suite-common/wallet-config';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';

import { useEarnRouteAccount } from '#src/components/earn/utils/useEarnRouteAccount';
import { EarnLayoutFallback } from '#src/views/earn/EarnLayoutFallback';

import { YieldVaultDetailContent } from './YieldVaultDetailContent';
import { useYieldFlowData } from '../hooks/useYieldFlowData';

export const YieldVaultDetail = () => {
    const { account, routeParams } = useEarnRouteAccount();

    const vaultAddress = routeParams?.vaultAddress
        ? getContractAddressForNetworkSymbol(routeParams.symbol, routeParams.vaultAddress)
        : undefined;

    const {
        data: vault,
        isLoading: isVaultLoading,
        isError: isVaultError,
    } = useGetVaultByAddress({
        enabled: !!vaultAddress,
        outputToken: vaultAddress,
        network: getNetworkOptional(routeParams?.symbol)?.yieldXyzId ?? undefined,
    });

    const yieldFlowData = useYieldFlowData({ account, vault });

    if (!routeParams) {
        return (
            <EarnLayoutFallback
                layoutState={{ status: 'invalid', reason: 'missing-route-params' }}
            />
        );
    }

    if (!account) {
        return (
            <EarnLayoutFallback layoutState={{ status: 'invalid', reason: 'missing-account' }} />
        );
    }

    if (isVaultLoading) {
        return <EarnLayoutFallback layoutState={{ status: 'loading' }} />;
    }

    if (isVaultError) {
        return (
            <EarnLayoutFallback
                layoutState={{ status: 'invalid', reason: 'yield-opportunities-error' }}
            />
        );
    }

    if (yieldFlowData.resolutionStatus === 'missing-network') {
        return (
            <EarnLayoutFallback layoutState={{ status: 'invalid', reason: 'network-mismatch' }} />
        );
    }

    if (yieldFlowData.resolutionStatus !== 'resolved') {
        return <EarnLayoutFallback layoutState={{ status: 'invalid', reason: 'missing-vault' }} />;
    }

    return <YieldVaultDetailContent yieldFlowData={yieldFlowData} />;
};
