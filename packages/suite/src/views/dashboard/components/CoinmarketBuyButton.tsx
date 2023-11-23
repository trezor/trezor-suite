import * as routerActions from 'src/actions/suite/routerActions';
import { Button } from '@trezor/components';
import { NetworkSymbol } from 'src/types/wallet';
import { Translation } from 'src/components/suite';
import { useDispatch, useAccountSearch } from 'src/hooks/suite';
import { EventType, analytics } from '@trezor/suite-analytics';

interface BuyButtonProps {
    symbol: NetworkSymbol;
    dataTest: string;
}

export const CoinmarketBuyButton = ({ symbol, dataTest }: BuyButtonProps) => {
    const dispatch = useDispatch();
    const { setCoinFilter, setSearchString } = useAccountSearch();

    const onClick = () => {
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
    };
    return (
        <Button onClick={onClick} variant="tertiary" data-test={dataTest} size="small">
            <Translation id="TR_BUY_BUY" />
        </Button>
    );
};
