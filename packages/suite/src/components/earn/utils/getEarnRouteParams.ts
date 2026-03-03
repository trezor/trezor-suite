import { Account } from '@suite-common/wallet-types';

import { RouteParams } from 'src/utils/suite/router';

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
