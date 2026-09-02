import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation, type TranslationKey } from '@suite/intl';
import { type Route, gotoThunk } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { useDispatch } from '@suite-common/redux-utils';
import { type IconComponent, SubTabs } from '@trezor/components';
import { HandshakeIcon, MinusIcon, PlusIcon, RepeatIcon } from '@trezor/icons';

type TradingLayoutNavigationProps = {
    route?: Route['name'];
};

type NavigationItem = {
    id: Route['name'];
    icon: IconComponent;
    translationId: TranslationKey;
};

const navigationItems: NavigationItem[] = [
    {
        id: 'wallet-trading-exchange',
        icon: RepeatIcon,
        translationId: 'TR_TRADING_SWAP',
    },
    {
        id: 'wallet-trading-buy',
        icon: PlusIcon,
        translationId: 'TR_NAV_BUY',
    },
    {
        id: 'wallet-trading-sell',
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
    const dispatch = useDispatch();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const goToRoute = (route: Route['name']) => () => {
        dispatch(gotoThunk({ routeName: route }));

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
                    icon={item.icon}
                    onClick={goToRoute(item.id)}
                >
                    <Translation id={item.translationId} />
                </SubTabs.Item>
            ))}
        </SubTabs>
    );
};
