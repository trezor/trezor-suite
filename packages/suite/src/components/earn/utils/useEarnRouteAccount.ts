import { parseEarnParams, selectRouterParams } from '@suite/router';
import { selectDeviceStaticSessionId } from '@suite-common/device';
import { selectDeviceAccounts } from '@suite-common/wallet-core';
import type { Account, WalletParams } from '@suite-common/wallet-types';

import { useSelector } from 'src/hooks/suite';
import { getSelectedAccount } from 'src/utils/wallet/accountUtils';

export type UseEarnRouteAccountResult = {
    account?: Account;
    routeParams: ReturnType<typeof parseEarnParams>;
};

export const useEarnRouteAccount = (): UseEarnRouteAccountResult => {
    const routeParams = parseEarnParams(useSelector(selectRouterParams));
    const deviceStaticSessionId = useSelector(selectDeviceStaticSessionId);
    const accounts = useSelector(selectDeviceAccounts);
    const accountParams: WalletParams = routeParams
        ? {
              symbol: routeParams.symbol,
              accountIndex: routeParams.accountIndex,
              accountType: routeParams.accountType,
          }
        : undefined;

    const account = getSelectedAccount(deviceStaticSessionId ?? undefined, accounts, accountParams);

    return {
        routeParams,
        account: account ?? undefined,
    };
};
