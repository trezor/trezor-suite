import { MouseEvent, ReactNode } from 'react';

import { goto } from '@suite/router';
import { Route } from '@suite-common/suite-types';
import { getTradingPrefilledFromAccountData, tradingActions } from '@suite-common/trading';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { selectVisibleDeviceAccounts } from '@suite-common/wallet-core';
import { Button } from '@trezor/components';

import { useAccountSearch, useDispatch, useSelector } from 'src/hooks/suite';

type TradingButtonProps = {
    children: ReactNode;
    onClick?: () => void;
    symbol: NetworkSymbol;
    routeName: Route['name'];
    'data-testid'?: string;
};

export const TradingButton = ({
    children,
    onClick: onButtonClick,
    symbol,
    routeName,
    'data-testid': dataTest,
}: TradingButtonProps) => {
    const dispatch = useDispatch();
    const { toggleCoinFilter, setSearchString } = useAccountSearch();
    const accounts = useSelector(selectVisibleDeviceAccounts);

    const onClick = (e: MouseEvent<HTMLButtonElement>) => {
        onButtonClick?.();

        const account = accounts.find(
            a => a.symbol === symbol && a.accountType === 'normal' && a.index === 0,
        );

        if (account) {
            dispatch(
                tradingActions.setTradingFromPrefilledAccount(
                    getTradingPrefilledFromAccountData(account),
                ),
            );
        }

        dispatch(goto({ routeName }));
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
