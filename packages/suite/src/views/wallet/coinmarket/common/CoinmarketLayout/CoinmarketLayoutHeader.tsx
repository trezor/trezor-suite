import { PropsWithChildren, useMemo } from 'react';

import { IconButton, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { Route } from '@suite-common/suite-types';

import {
    PageHeader,
    NavigationItem,
    SubpageNavigation,
} from 'src/components/suite/layouts/SuiteLayout';
import { selectRouteName } from 'src/reducers/suite/routerReducer';
import { BasicName } from 'src/components/suite/layouts/SuiteLayout/PageHeader/PageNames/BasicName';
import { useLayout, useSelector, useTranslation, useDispatch } from 'src/hooks/suite';
import { TranslationKey, Translation } from 'src/components/suite/Translation';
import { goto } from 'src/actions/suite/routerActions';

interface CoinmarketLayoutHeaderProps extends PropsWithChildren {}

type CoinmarketPageHeaderProps = {
    fallbackTitle: TranslationKey;
};

const getBackRoute = (route: Route['name'] | undefined): Route['name'] => {
    const routePrefix = 'wallet-coinmarket-';
    const match = route?.match(new RegExp(`^${routePrefix}(exchange|buy|sell)-`));

    return match ? (`${routePrefix}${match[1]}` as Route['name']) : 'wallet-index';
};

const CoinmarketPageHeader = ({ fallbackTitle }: CoinmarketPageHeaderProps) => {
    const dispatch = useDispatch();
    const currentRouteName = useSelector(selectRouteName);

    const goToRoute = (route: Route['name']) => () => {
        dispatch(goto(route, { preserveParams: true }));
    };

    const handleBackClick = () =>
        dispatch(
            goto(getBackRoute(currentRouteName), {
                preserveParams: true,
            }),
        );

    const coinmarketSubpages: NavigationItem[] = [
        {
            id: 'wallet-coinmarket-buy',
            title: <Translation id="TR_NAV_BUY" />,
            'data-testid': '@coinmarket/menu/wallet-coinmarket-buy',
            callback: goToRoute('wallet-coinmarket-buy'),
        },
        {
            id: 'wallet-coinmarket-sell',
            title: <Translation id="TR_NAV_SELL" />,
            'data-testid': '@coinmarket/menu/wallet-coinmarket-sell',
            callback: goToRoute('wallet-coinmarket-sell'),
        },
        {
            id: 'wallet-coinmarket-dca',
            title: <Translation id="TR_NAV_DCA" />,
            'data-testid': '@coinmarket/menu/wallet-coinmarket-dca',
            callback: goToRoute('wallet-coinmarket-dca'),
        },
        {
            id: 'wallet-coinmarket-transactions',
            title: <Translation id="TR_COINMARKET_LAST_TRANSACTIONS" />,
            'data-testid': '@coinmarket/menu/wallet-coinmarket-transactions',
            callback: goToRoute('wallet-coinmarket-transactions'),
        },
    ];

    return (
        <>
            <PageHeader>
                <Row gap={spacings.md}>
                    <IconButton
                        icon="caretLeft"
                        variant="tertiary"
                        size="medium"
                        onClick={handleBackClick}
                        data-testid="@account-subpage/back"
                    />
                    <BasicName nameId={fallbackTitle} />
                </Row>
            </PageHeader>
            {!currentRouteName?.startsWith('wallet-coinmarket-exchange') && (
                <SubpageNavigation items={coinmarketSubpages} />
            )}
        </>
    );
};

export const CoinmarketLayoutHeader = ({ children }: CoinmarketLayoutHeaderProps) => {
    const { activeSection } = useSelector(state => state.wallet.coinmarket);
    const { translationString } = useTranslation();
    const fallbackTitle = useMemo(
        () => (activeSection === 'exchange' ? 'TR_COINMARKET_SWAP' : 'TR_COINMARKET_BUY_AND_SELL'),
        [activeSection],
    );

    const translatedTitle = translationString(fallbackTitle);
    const pageTitle = `Trezor Suite | ${translatedTitle}`;

    useLayout(pageTitle, <CoinmarketPageHeader fallbackTitle={fallbackTitle} />);

    if (!children) return null;

    return children;
};
