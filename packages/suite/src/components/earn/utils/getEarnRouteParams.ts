import { RouteParams } from '@suite/router';
import { Account } from '@suite-common/wallet-types';

type GetEarnRouteParamsProps = {
    account: Account;
    yieldId: string;
    contractAddress?: string;
};

export const getEarnRouteParams = ({
    account,
    yieldId,
    contractAddress,
}: GetEarnRouteParamsProps): RouteParams => ({
    symbol: account.symbol,
    accountIndex: account.index,
    accountType: account.accountType,
    yieldId: encodeURIComponent(yieldId),
    contractAddress: contractAddress ? encodeURIComponent(contractAddress) : undefined,
});
