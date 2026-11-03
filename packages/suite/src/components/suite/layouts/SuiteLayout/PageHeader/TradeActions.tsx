import { type TradeNavigateEventFrom, events, injectDesktopAnalytics } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { selectIsRegionRestricted } from '@suite/regions';
import { gotoThunk, selectIsAccountTabPage } from '@suite/router';
import { type TradingPrefilledFromAccount, tradingActions } from '@suite-common/trading';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { ButtonGroup, Row } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { MinusIcon, PlusIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';

import { AppNavigationTooltip } from 'src/components/suite/AppNavigation/AppNavigationTooltip';
import { HeaderActionButton } from 'src/components/suite/layouts/SuiteLayout/PageHeader/HeaderActionButton';
import { useSelector } from 'src/hooks/suite';

type TradeActionsSource = {
    from: TradeNavigateEventFrom;
    networkSymbol?: NetworkSymbol;
    contractAddress?: string;
};

type TradeActionsPrefill = {
    buy?: TradingPrefilledFromAccount;
    sell?: TradingPrefilledFromAccount;
};

type TradeActionsProps = {
    source: TradeActionsSource;
    prefill?: TradeActionsPrefill;
    isDisabled?: boolean;
    canBuy?: boolean;
    canSell?: boolean;
};

export const TradeActions = ({
    source,
    prefill,
    isDisabled,
    canBuy = true,
    canSell = true,
}: TradeActionsProps) => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const isAccountTabPage = useSelector(selectIsAccountTabPage);
    const isRegionRestricted = useSelector(selectIsRegionRestricted);

    if (isRegionRestricted || (!canBuy && !canSell)) {
        return null;
    }

    const goToWithAnalytics = (...[payload]: Parameters<typeof gotoThunk>) => {
        if (isAccountTabPage && source.networkSymbol) {
            analytics.report({
                type: events.accountsActionsEvent.name,
                payload: { symbol: source.networkSymbol, action: payload.routeName },
            });
        }

        dispatch(gotoThunk(payload));
    };

    const navigateToTrading = (type: 'buy' | 'sell') => {
        const routeName = `wallet-trading-${type}` as const;
        const typePrefill = prefill?.[type];

        if (typePrefill) {
            dispatch(tradingActions.setTradingFromPrefilledAccount(typePrefill));
        }

        goToWithAnalytics({ routeName, preserveParams: false });

        if (source.from === 'dashboard/header') {
            analytics.report({
                type: events.navigateFlowEvent.name,
                payload: { action: 'navigate', type, from: source.from },
            });

            return;
        }

        analytics.report({
            type: events.tradeNavigateEvent.name,
            payload: {
                action: 'navigate',
                type,
                from: source.from,
                networkSymbol: source.networkSymbol,
                ...(source.contractAddress ? { contractAddress: source.contractAddress } : {}),
            },
        });
    };

    return (
        <Row gap={12}>
            <AppNavigationTooltip>
                <ButtonGroup intent="neutral" priority="secondary" isDisabled={isDisabled}>
                    {canBuy ? (
                        <HeaderActionButton
                            icon={PlusIcon}
                            onClick={() => navigateToTrading('buy')}
                            data-testid="@wallet/menu/wallet-trading-buy"
                        >
                            <Translation id="TR_NAV_BUY" />
                        </HeaderActionButton>
                    ) : null}
                    {canSell ? (
                        <HeaderActionButton
                            icon={MinusIcon}
                            onClick={() => navigateToTrading('sell')}
                            data-testid="@wallet/menu/wallet-trading-sell"
                        >
                            <Translation id="TR_NAV_SELL" />
                        </HeaderActionButton>
                    ) : null}
                </ButtonGroup>
            </AppNavigationTooltip>
        </Row>
    );
};
