import { MouseEvent } from 'react';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { Button } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';

import * as routerActions from 'src/actions/suite/routerActions';
import { Translation } from 'src/components/suite';
import { useAccountSearch, useDispatch } from 'src/hooks/suite';

type TradingBuyButtonProps = {
    symbol: NetworkSymbol;
    'data-testid'?: string;
};

export const TradingBuyButton = ({ symbol, 'data-testid': dataTest }: TradingBuyButtonProps) => {
    const dispatch = useDispatch();
    const { setCoinFilter, setSearchString } = useAccountSearch();

    const onClick = (e: MouseEvent<HTMLButtonElement>) => {
        analytics.report({
            type: EventType.AccountsDashboardBuy,
            payload: {
                symbol,
            },
        });

        dispatch(
            routerActions.goto('wallet-trading-buy', {
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
            <Translation id="TR_BUY_BUY" />
        </Button>
    );
};
