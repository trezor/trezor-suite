import { type MouseEvent, type ReactNode } from 'react';

import { type Route, goto } from '@suite/router';
import { getTradingPrefilledFromAccountData, tradingActions } from '@suite-common/trading';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectVisibleDeviceAccounts } from '@suite-common/wallet-core';
import { Button } from '@trezor/components';
import { exhaustive } from '@trezor/type-utils';

import { useAccountSearch, useDispatch, useSelector } from 'src/hooks/suite';
import { getAssetAccountRouteParams } from 'src/utils/wallet/accountUtils';

type AssetActionButtonRoute = Extract<Route['name'], 'wallet-staking' | 'wallet-trading-buy'>;

type AssetActionButtonProps = {
    children: ReactNode;
    onClick?: () => void;
    symbol: NetworkSymbol;
    routeName: AssetActionButtonRoute;
    'data-testid'?: string;
};

export const AssetActionButton = ({
    children,
    onClick: onButtonClick,
    symbol,
    routeName,
    'data-testid': dataTest,
}: AssetActionButtonProps) => {
    const dispatch = useDispatch();
    const { toggleCoinFilter, setSearchString } = useAccountSearch();
    const accounts = useSelector(selectVisibleDeviceAccounts);
    const networkAccounts = accounts.filter(account => account.symbol === symbol);

    const onClick = (e: MouseEvent<HTMLButtonElement>) => {
        onButtonClick?.();

        const account =
            networkAccounts.find(
                ({ accountType, index }) => accountType === 'normal' && index === 0,
            ) ?? networkAccounts[0];

        switch (routeName) {
            case 'wallet-staking':
                dispatch(
                    goto({
                        routeName,
                        params: getAssetAccountRouteParams(accounts, symbol),
                    }),
                );
                break;
            case 'wallet-trading-buy':
                if (account) {
                    dispatch(
                        tradingActions.setTradingFromPrefilledAccount(
                            getTradingPrefilledFromAccountData(account),
                        ),
                    );
                }
                dispatch(goto({ routeName }));
                break;
            default:
                exhaustive(routeName);
        }
        toggleCoinFilter(symbol);
        setSearchString(undefined);

        // Prevent parent handler from triggering onClick,
        // for example when the button is used in clickable Card
        e.stopPropagation();
    };

    return (
        <Button onClick={onClick} intent="neutral" priority="secondary" data-testid={dataTest}>
            {children}
        </Button>
    );
};
