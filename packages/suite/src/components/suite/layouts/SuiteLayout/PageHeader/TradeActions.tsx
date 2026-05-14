import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { goto, selectIsAccountTabPage, selectRouteName } from '@suite/router';
import { selectSelectedDevice } from '@suite-common/device';
import { getTradingPrefilledFromAccountData, tradingActions } from '@suite-common/trading';
import { type SelectedAccountStatus } from '@suite-common/wallet-types';
import { Row } from '@trezor/components';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';
import { breakpoints } from '@trezor/theme';

import { AppNavigationTooltip } from 'src/components/suite/AppNavigation/AppNavigationTooltip';
import { HeaderActionButton } from 'src/components/suite/layouts/SuiteLayout/PageHeader/HeaderActionButton';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { ConditionalRender } from 'src/support/suite/ConditionalRender';
import { useAnalytics } from 'src/support/useAnalytics';

interface TradeActionsProps {
    selectedAccount?: SelectedAccountStatus;
}

export const TradeActions = ({ selectedAccount }: TradeActionsProps) => {
    const analytics = useAnalytics();
    const dispatch = useDispatch();
    const account = selectedAccount?.account;
    const device = useSelector(selectSelectedDevice);
    const isAccountTabPage = useSelector(selectIsAccountTabPage);
    const currentRouteName = useSelector(selectRouteName);

    const goToWithAnalytics = (...[payload]: Parameters<typeof goto>) => {
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

        dispatch(goto(payload));
    };

    const onBuyAndSellClick = () => {
        if (account) {
            dispatch(
                tradingActions.setTradingFromPrefilledAccount(
                    getTradingPrefilledFromAccountData(account),
                ),
            );
        }

        goToWithAnalytics({ routeName: 'wallet-trading-buy' });

        analytics.report({
            type: events.tradeNavigateEvent.name,
            payload: {
                action: 'navigate',
                type: 'buy/sell',
                from: account ? 'account/header' : 'dashboard/header',
                networkSymbol: account?.symbol,
            },
        });
    };

    const onSwapClick = () => {
        if (account) {
            dispatch(
                tradingActions.setTradingFromPrefilledAccount(
                    getTradingPrefilledFromAccountData(account),
                ),
            );
        }

        goToWithAnalytics({ routeName: 'wallet-trading-exchange', preserveParams: false });

        analytics.report({
            type: events.tradeNavigateEvent.name,
            payload: {
                action: 'navigate',
                type: 'exchange',
                from: account ? 'account/header' : 'dashboard/header',
                networkSymbol: account?.symbol,
            },
        });
    };

    const isAccountLoading = selectedAccount ? selectedAccount.status === 'loading' : false;

    return (
        <Row gap={12}>
            <AppNavigationTooltip>
                <ConditionalRender container="content" minWidth={breakpoints.laptop}>
                    <HeaderActionButton
                        icon="currencyCircleDollar"
                        onClick={onBuyAndSellClick}
                        data-testid="@wallet/menu/wallet-trading-buy"
                        intent="neutral"
                        priority="secondary"
                        isDisabled={isAccountLoading}
                    >
                        <Translation id="TR_TRADING_BUY_AND_SELL" />
                    </HeaderActionButton>
                </ConditionalRender>
                {!hasBitcoinOnlyFirmware(device) && (
                    <ConditionalRender container="content" minWidth={breakpoints.tablet}>
                        <HeaderActionButton
                            icon="arrowsLeftRight"
                            onClick={onSwapClick}
                            data-testid="@wallet/menu/wallet-trading-exchange"
                            intent="neutral"
                            priority="secondary"
                            isDisabled={isAccountLoading}
                        >
                            <Translation id="TR_TRADING_SWAP" />
                        </HeaderActionButton>
                    </ConditionalRender>
                )}
            </AppNavigationTooltip>
        </Row>
    );
};
