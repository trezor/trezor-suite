import { selectSelectedDevice } from '@suite-common/device';
import { selectDeviceAccounts } from '@suite-common/wallet-core';
import { WalletParams } from '@suite-common/wallet-types';

import { useSelector } from 'src/hooks/suite';
import { selectRouterParams } from 'src/reducers/suite/routerReducer';
import { parseEarnParams } from 'src/utils/suite/routerParams';
import { getSelectedAccount } from 'src/utils/wallet/accountUtils';

export const useEarnRouteAccount = () => {
    const routeParams = parseEarnParams(useSelector(selectRouterParams));
    const selectedDevice = useSelector(selectSelectedDevice);
    const accounts = useSelector(selectDeviceAccounts);
    const accountParams: WalletParams = routeParams
        ? {
              symbol: routeParams.symbol,
              accountIndex: routeParams.accountIndex,
              accountType: routeParams.accountType,
          }
        : undefined;

    const account = getSelectedAccount(
        selectedDevice?.state?.staticSessionId,
        accounts,
        accountParams,
    );

    return {
        routeParams,
        account,
    };
};
