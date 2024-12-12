import { PropsWithChildren, useMemo } from 'react';

import { IconButton, Row, Box, Button } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { Route } from '@suite-common/suite-types';

import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { BasicName } from 'src/components/suite/layouts/SuiteLayout/PageHeader/PageNames/BasicName';
import { useLayout, useSelector, useTranslation, useDispatch } from 'src/hooks/suite';
import { selectRouteName } from 'src/reducers/suite/routerReducer';
import { TranslationKey, Translation } from 'src/components/suite/Translation';
import { goto } from 'src/actions/suite/routerActions';
import { CoinmarketTradeType } from 'src/types/coinmarket/coinmarket';

const getBackRoute = (
    route?: Route['name'],
    activeSection?: CoinmarketTradeType,
): Route['name'] => {
    const routePrefix = 'wallet-coinmarket-';
    const match = route?.match(new RegExp(`^${routePrefix}(exchange|buy|sell)-`));

    if (route === `${routePrefix}transactions`) {
        return activeSection === 'exchange' ? `${routePrefix}exchange` : `${routePrefix}buy`;
    }

    return match ? (`${routePrefix}${match[1]}` as Route['name']) : 'wallet-index';
};

type CoinmarketPageHeaderProps = {
    fallbackTitle: TranslationKey;
};

const CoinmarketPageHeader = ({ fallbackTitle }: CoinmarketPageHeaderProps) => {
    const dispatch = useDispatch();
    const currentRouteName = useSelector(selectRouteName);
    const activeSection = useSelector(state => state.wallet.coinmarket.activeSection);

    const goToRoute = (route: Route['name']) => () => {
        dispatch(goto(route, { preserveParams: true }));
    };

    return (
        <PageHeader>
            <Row width="100%" gap={spacings.md}>
                <IconButton
                    icon="caretLeft"
                    variant="tertiary"
                    size="medium"
                    onClick={goToRoute(getBackRoute(currentRouteName, activeSection))}
                    data-testid="@account-subpage/back"
                />
                <BasicName nameId={fallbackTitle} />
                {currentRouteName !== 'wallet-coinmarket-transactions' && (
                    <Box margin={{ left: 'auto' }}>
                        <Button
                            size="small"
                            variant="tertiary"
                            margin={{ left: 'auto' }}
                            onClick={goToRoute('wallet-coinmarket-transactions')}
                            data-testid="@coinmarket/menu/wallet-coinmarket-transactions"
                        >
                            <Translation id="TR_COINMARKET_LAST_TRANSACTIONS" />
                        </Button>
                    </Box>
                )}
            </Row>
        </PageHeader>
    );
};

export const CoinmarketLayoutHeader = ({ children }: PropsWithChildren) => {
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
