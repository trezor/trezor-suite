import * as routerActions from 'src/actions/suite/routerActions';
import { Button } from '@trezor/components';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { Translation } from 'src/components/suite';
import { useDispatch, useAccountSearch } from 'src/hooks/suite';
import { EventType, analytics } from '@trezor/suite-analytics';
import { MouseEvent } from 'react';

interface BuyButtonProps {
    symbol: NetworkSymbol;
    'data-testid'?: string;
}

export const CoinmarketBuyButton = ({ symbol, 'data-testid': dataTest }: BuyButtonProps) => {
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
            routerActions.goto('wallet-coinmarket-buy', {
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
