import { MouseEvent, ReactNode } from 'react';

import { Route } from '@suite-common/suite-types';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { Button } from '@trezor/components';

import * as routerActions from 'src/actions/suite/routerActions';
import { useAccountSearch, useDispatch } from 'src/hooks/suite';

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
    const { setCoinFilter, setSearchString } = useAccountSearch();

    const onClick = (e: MouseEvent<HTMLButtonElement>) => {
        onButtonClick?.();

        dispatch(
            routerActions.goto(routeName, {
                params: {
                    symbol,
                    accountIndex: 0,
                    accountType: 'normal',
                },
            }),
        );
        setCoinFilter(symbol);
        setSearchString(undefined);

        // Prevent parent handler from triggering onClick,
        // for example when the button is used in clickable Card
        e.stopPropagation();
    };

    return (
        <Button onClick={onClick} variant="tertiary" data-testid={dataTest} size="small">
            {children}
        </Button>
    );
};
