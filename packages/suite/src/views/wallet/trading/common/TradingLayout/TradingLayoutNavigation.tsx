import { Translation, TranslationKey } from '@suite/intl';
import { Route } from '@suite-common/suite-types';
import { IconName, SubTabs } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';

import { goto } from 'src/actions/suite/routerActions';
import { useDispatch } from 'src/hooks/suite';

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
];

export const TradingLayoutNavigation = ({ route }: TradingLayoutNavigationProps) => {
    const dispatch = useDispatch();

    const goToRoute = (route: Route['name']) => () => {
        dispatch(goto(route, { preserveParams: true }));

        switch (route) {
            case 'wallet-trading-buy':
                return analytics.report({
                    type: EventType.TradingNavigate,
                    payload: {
                        action: 'navigate',
                        type: 'buy',
                        from: 'buy/sell/dca-form',
                    },
                });
            case 'wallet-trading-sell':
                return analytics.report({
                    type: EventType.TradingNavigate,
                    payload: {
                        action: 'navigate',
                        type: 'sell',
                        from: 'buy/sell/dca-form',
                    },
                });
            case 'wallet-trading-dca':
                return analytics.report({
                    type: EventType.TradingNavigate,
                    payload: {
                        action: 'navigate',
                        type: 'dca',
                        from: 'buy/sell/dca-form',
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
