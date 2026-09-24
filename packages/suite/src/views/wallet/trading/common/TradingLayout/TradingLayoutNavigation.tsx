import { events, injectDesktopAnalytics } from '@suite/analytics';
import { Translation, type TranslationKey } from '@suite/intl';
import { type Route, gotoThunk } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { type TradingType, tradingThunks } from '@suite-common/trading';
import { type IconComponent, SubTabs } from '@trezor/components';
import { HandshakeIcon, MinusIcon, PlusIcon, RepeatIcon } from '@trezor/icons';

type TradingLayoutNavigationProps = {
    route?: Route['name'];
};

type NavigationItem = {
    id: Route['name'];
    tradingType?: TradingType;
    icon: IconComponent;
    translationId: TranslationKey;
};

const navigationItems: NavigationItem[] = [
    {
        id: 'wallet-trading-exchange',
        tradingType: 'exchange',
        icon: RepeatIcon,
        translationId: 'TR_TRADING_SWAP',
    },
    {
        id: 'wallet-trading-buy',
        tradingType: 'buy',
        icon: PlusIcon,
        translationId: 'TR_NAV_BUY',
    },
    {
        id: 'wallet-trading-sell',
        tradingType: 'sell',
        icon: MinusIcon,
        translationId: 'TR_NAV_SELL',
    },
    {
        id: 'wallet-trading-concierge',
        icon: HandshakeIcon,
        translationId: 'TR_NAV_CONCIERGE',
    },
];

export const TradingLayoutNavigation = ({ route }: TradingLayoutNavigationProps) => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const goToRoute = (routeName: Route['name'], tradingType?: TradingType) => () => {
        if (tradingType && routeName !== route) {
            dispatch(tradingThunks.clearQuotesAndParamsByTradingTypeThunk({ tradingType }));
        }

        dispatch(gotoThunk({ routeName }));

        switch (routeName) {
            case 'wallet-trading-buy':
                return analytics.report({
                    type: events.tradeNavigateEvent.name,
                    payload: {
                        action: 'navigate',
                        type: 'buy',
                        from: 'buy/sell',
                    },
                });
            case 'wallet-trading-sell':
                return analytics.report({
                    type: events.tradeNavigateEvent.name,
                    payload: {
                        action: 'navigate',
                        type: 'sell',
                        from: 'buy/sell',
                    },
                });
            case 'wallet-trading-exchange':
                return analytics.report({
                    type: events.tradeNavigateEvent.name,
                    payload: {
                        action: 'navigate',
                        type: 'exchange',
                        from: 'buy/sell',
                    },
                });
            case 'wallet-trading-concierge':
                return analytics.report({
                    type: events.tradeNavigateEvent.name,
                    payload: {
                        action: 'navigate',
                        type: 'concierge',
                        from: 'buy/sell',
                    },
                });
        }
    };

    return (
        <SubTabs activeItemId={route} size="large">
            {navigationItems.map(item => (
                <SubTabs.Item
                    key={item.id}
                    data-testid={`@trading/menu/${item.id}`}
                    id={item.id}
                    icon={item.icon}
                    onClick={goToRoute(item.id, item.tradingType)}
                >
                    <Translation id={item.translationId} />
                </SubTabs.Item>
            ))}
        </SubTabs>
    );
};
