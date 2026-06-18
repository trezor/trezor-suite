import { useEffect } from 'react';

import { selectIsDebugModeActive } from '@suite/debug';
import { goto } from '@suite/router';

import { TronStakePageHeader, TronWithdraw } from 'src/components/earn';
import { useEarnRouteAccount } from 'src/components/earn/utils/useEarnRouteAccount';
import { AccountNotExists } from 'src/components/wallet/WalletLayout/AccountException/AccountNotExists';
import { useDispatch, useLayout, useSelector } from 'src/hooks/suite';

export const EarnTronWithdraw = () => {
    const dispatch = useDispatch();
    const isDebugModeActive = useSelector(selectIsDebugModeActive);
    const { account } = useEarnRouteAccount();

    useLayout('Earn', <TronStakePageHeader account={account} />);

    useEffect(() => {
        if (!isDebugModeActive) {
            dispatch(goto({ routeName: 'suite-earn' }));
        }
    }, [isDebugModeActive, dispatch]);

    if (!isDebugModeActive) {
        return null;
    }

    if (!account) {
        return <AccountNotExists />;
    }

    return <TronWithdraw account={account} />;
};
