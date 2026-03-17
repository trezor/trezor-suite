import { events } from '@suite/analytics';
import { Translation, type TranslationKey } from '@suite/intl';
import { type Route, goto } from '@suite/router';
import { type IconName, SubTabs } from '@trezor/components';

import { useDispatch } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

type TradingLayoutNavigationProps = {
    route?: Route['name'];
};

type NavigationItem = {
    id: Route['name'];
    icon: IconName;
    translationId: TranslationKey;
};

const navigationItems: NavigationItem[] = [
    {
        id: 'wallet-trading-buy',
        icon: 'plus',
        translationId: 'TR_NAV_BUY',
    },
    {
        id: 'wallet-trading-sell',
        icon: 'minus',
        translationId: 'TR_NAV_SELL',
    },
    {
        id: 'wallet-trading-exchange',
        icon: 'arrowsLeftRight',
        translationId: 'TR_TRADING_SWAP',
    },
    {
        id: 'wallet-trading-concierge',
        icon: 'handshake',
        translationId: 'TR_NAV_CONCIERGE',
    },
];

export const TradingLayoutNavigation = ({ route }: TradingLayoutNavigationProps) => {
    const dispatch = useDispatch();
    const analytics = useAnalytics();
    const goToRoute = (route: Route['name']) => () => {
        dispatch(goto({ routeName: route }));

        switch (route) {
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
                    iconName={item.icon}
                    onClick={goToRoute(item.id)}
                >
                    <Translation id={item.translationId} />
                </SubTabs.Item>
            ))}
        </SubTabs>
    );
};
