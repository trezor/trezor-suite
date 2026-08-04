import { type RouteParams } from '@suite/router';
import { type GetNetworkConfigDep } from '@suite-common/networks';
import { type Account } from '@suite-common/wallet-types';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';

type GetEarnRouteParamsProps = GetNetworkConfigDep & {
    account: Account;
    vaultAddress: string;
};

/**
 * Params of a vault-scoped Earn route, e.g. `#/eth/0/normal/0x704cfb08…`. The vault address is
 * normalized so the same vault always yields the same URL, whatever casing the API reports.
 */
export const getEarnRouteParams = ({
    getNetworkConfig,
    account,
    vaultAddress,
}: GetEarnRouteParamsProps): RouteParams => ({
    symbol: account.symbol,
    accountIndex: account.index,
    accountType: account.accountType,
    vaultAddress: encodeURIComponent(
        getContractAddressForNetworkSymbol({ getNetworkConfig }, account.symbol, vaultAddress),
    ),
});
