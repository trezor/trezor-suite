import { events, injectDesktopAnalytics } from '@suite/analytics';
import { Translation, type TranslationKey } from '@suite/intl';
import { type Route, gotoThunk } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { Box, type IconComponent, SubTabs } from '@trezor/components';
import { MinusIcon, PlusIcon, RepeatIcon } from '@trezor/icons';

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
];

export const TradingLayoutNavigation = ({ route }: TradingLayoutNavigationProps) => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);

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
        }
    };

    return (
        <Box width="100%" maxWidth={400} margin={{ horizontal: 'auto' }}>
            <Box padding={{ vertical: 4 }}>
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
            </Box>
        </Box>
    );
};
