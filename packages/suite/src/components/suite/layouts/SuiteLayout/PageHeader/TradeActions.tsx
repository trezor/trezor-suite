import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { gotoThunk, selectIsAccountTabPage, selectRouteName } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { useDispatch } from '@suite-common/redux-utils';
import { getTradingPrefilledFromAccountData, tradingActions } from '@suite-common/trading';
import { type SelectedAccountStatus } from '@suite-common/wallet-types';
import { ButtonGroup, Row } from '@trezor/components';
import { MinusIcon, PlusIcon } from '@trezor/icons';

import { AppNavigationTooltip } from 'src/components/suite/AppNavigation/AppNavigationTooltip';
import { HeaderActionButton } from 'src/components/suite/layouts/SuiteLayout/PageHeader/HeaderActionButton';
import { useSelector } from 'src/hooks/suite';

interface TradeActionsProps {
    selectedAccount?: SelectedAccountStatus;
}

export const TradeActions = ({ selectedAccount }: TradeActionsProps) => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const dispatch = useDispatch();
    const account = selectedAccount?.account;
    const isAccountTabPage = useSelector(selectIsAccountTabPage);
    const currentRouteName = useSelector(selectRouteName);

    const goToWithAnalytics = (...[payload]: Parameters<typeof gotoThunk>) => {
        if (currentRouteName === 'suite-index') {
            analytics.report({
                type: events.dashboardActionsEvent.name,
                payload: { type: payload.routeName },
            });
        }

        if (isAccountTabPage && account?.symbol) {
            analytics.report({
                type: events.accountsActionsEvent.name,
                payload: { symbol: account?.symbol, action: payload.routeName },
            });
        }

        dispatch(gotoThunk(payload));
    };

    const navigateToTrading = (type: 'buy' | 'sell') => {
        const routeName = `wallet-trading-${type}` as const;

        if (account) {
            dispatch(
                tradingActions.setTradingFromPrefilledAccount(
                    getTradingPrefilledFromAccountData(account),
                ),
            );
        }

        goToWithAnalytics({ routeName, preserveParams: false });

        analytics.report({
            type: events.tradeNavigateEvent.name,
            payload: {
                action: 'navigate',
                type,
                from: account ? 'account/header' : 'dashboard/header',
                networkSymbol: account?.symbol,
            },
        });
    };

    const isAccountLoading = selectedAccount ? selectedAccount.status === 'loading' : false;

    return (
        <Row gap={12}>
            <AppNavigationTooltip>
                <ButtonGroup intent="neutral" priority="secondary" isDisabled={isAccountLoading}>
                    <HeaderActionButton
                        icon={PlusIcon}
                        onClick={() => navigateToTrading('buy')}
                        data-testid="@wallet/menu/wallet-trading-buy"
                    >
                        <Translation id="TR_NAV_BUY" />
                    </HeaderActionButton>
                    <HeaderActionButton
                        icon={MinusIcon}
                        onClick={() => navigateToTrading('sell')}
                        data-testid="@wallet/menu/wallet-trading-sell"
                    >
                        <Translation id="TR_NAV_SELL" />
                    </HeaderActionButton>
                </ButtonGroup>
            </AppNavigationTooltip>
        </Row>
    );
};
