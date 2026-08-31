import { type ReactNode } from 'react';
import { useDispatch } from 'react-redux';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { type Route, goto } from '@suite/router';
import { events as sharedEvents } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { getTradingPrefilledFromAccountData, tradingActions } from '@suite-common/trading';
import { Button } from '@trezor/components';
import { exhaustive } from '@trezor/type-utils';

import { type Account } from 'src/types/wallet';

// All action buttons share a fixed minimum so the row reads as a uniform group.
const ACTION_BUTTON_MIN_WIDTH = 76;

type TradeBoxActionType = 'buy' | 'sell' | 'exchange' | 'earn';

type TradeBoxActionButtonProps = {
    account: Account;
    type: TradeBoxActionType;
    children: ReactNode;
    isDisabled?: boolean;
};

/** Navigates from the account TradeBox to the trading flow or the earn dashboard. */
export const TradeBoxActionButton = ({
    account,
    type,
    children,
    isDisabled = false,
}: TradeBoxActionButtonProps) => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectDesktopAnalyticsDep);

    const dataTestId =
        type === 'earn' ? '@account/tradebox/earn' : `@trading/menu/wallet-trading-${type}`;

    const handleOnClick = () => {
        switch (type) {
            case 'buy':
            case 'sell':
            case 'exchange': {
                const gotoRouteName: Route['name'] = `wallet-trading-${type}`;

                dispatch(
                    tradingActions.setTradingFromPrefilledAccount(
                        getTradingPrefilledFromAccountData(account),
                    ),
                );

                dispatch(goto({ routeName: gotoRouteName }));

                analytics.report({
                    type: events.tradeNavigateEvent.name,
                    payload: {
                        action: 'navigate',
                        type,
                        from: 'account/tradebox',
                        networkSymbol: account.symbol,
                    },
                });

                break;
            }
            case 'earn': {
                dispatch(goto({ routeName: 'suite-earn' }));

                analytics.report({
                    type: sharedEvents.yieldNavigateEvent.name,
                    payload: {
                        action: 'continue',
                        from: 'account-tradebox',
                        to: 'earn-dashboard',
                        networkSymbol: account.symbol,
                    },
                });

                break;
            }
            default:
                exhaustive(type);
        }
    };

    return (
        <Button
            intent="neutral"
            priority="secondary"
            size="small"
            minWidth={ACTION_BUTTON_MIN_WIDTH}
            onClick={handleOnClick}
            data-testid={dataTestId}
            isDisabled={isDisabled}
        >
            {children}
        </Button>
    );
};
