import { type RouteParams } from '@suite/router';
import { type Account } from '@suite-common/wallet-types';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';

type GetEarnRouteParamsProps = {
    account: Account;
    vaultAddress: string;
};

/**
 * Params of a vault-scoped Earn route, e.g. `#/eth/0/normal/0x704cfb08…`. The vault address is
 * normalized so the same vault always yields the same URL, whatever casing the API reports.
 */
export const getEarnRouteParams = ({
    account,
    vaultAddress,
}: GetEarnRouteParamsProps): RouteParams => ({
    symbol: account.symbol,
    accountIndex: account.index,
    accountType: account.accountType,
    vaultAddress: encodeURIComponent(
        getContractAddressForNetworkSymbol(account.symbol, vaultAddress),
    ),
});
