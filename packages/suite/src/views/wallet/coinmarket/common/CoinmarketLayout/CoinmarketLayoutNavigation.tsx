import { IconName, SubTabs } from '@trezor/components';
import { Route } from '@suite-common/suite-types';

import { useDispatch } from 'src/hooks/suite';
import { Translation, TranslationKey } from 'src/components/suite/Translation';
import { goto } from 'src/actions/suite/routerActions';

type CoinmarketLayoutNavigationProps = {
    route?: Route['name'];
};

type NavigationItem = {
    id: Route['name'];
    icon: IconName;
    translationId: TranslationKey;
};

const navigationItems: NavigationItem[] = [
    {
        id: 'wallet-coinmarket-buy',
        icon: 'plus',
        translationId: 'TR_NAV_BUY',
    },
    {
        id: 'wallet-coinmarket-sell',
        icon: 'minus',
        translationId: 'TR_NAV_SELL',
    },
    {
        id: 'wallet-coinmarket-dca',
        icon: 'clock',
        translationId: 'TR_NAV_DCA',
    },
];

export const CoinmarketLayoutNavigation = ({ route }: CoinmarketLayoutNavigationProps) => {
    const dispatch = useDispatch();

    const goToRoute = (route: Route['name']) => () => {
        dispatch(goto(route, { preserveParams: true }));
    };

    return (
        <SubTabs activeItemId={route} size="large">
            {navigationItems.map(item => (
                <SubTabs.Item
                    key={item.id}
                    data-testid={`@coinmarket/menu/${item.id}`}
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
