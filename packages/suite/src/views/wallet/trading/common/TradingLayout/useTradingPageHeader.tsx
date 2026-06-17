import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import { type Route, goto, selectRouteName } from '@suite/router';
import { type TradingType, selectTradingActiveSection } from '@suite-common/trading';
import { Box, Button, IconButton, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { BasicName } from 'src/components/suite/layouts/SuiteLayout/PageHeader/PageNames/BasicName';
import { useDispatch, useLayout, useSelector } from 'src/hooks/suite';

const getBackRoute = (route?: Route['name'], activeSection?: TradingType): Route['name'] => {
    const routePrefix = 'wallet-trading-';
    const match = route?.match(new RegExp(`^${routePrefix}(exchange|buy|sell)-`));

    if (route === `${routePrefix}transactions`) {
        return activeSection === 'exchange' ? `${routePrefix}exchange` : `${routePrefix}buy`;
    }

    return match ? (`${routePrefix}${match[1]}` as Route['name']) : 'suite-index';
};

type TradingPageHeaderProps = {
    fallbackTitle: TranslationKey;
};

const TradingPageHeader = ({ fallbackTitle }: TradingPageHeaderProps) => {
    const dispatch = useDispatch();
    const currentRouteName = useSelector(selectRouteName);
    const activeSection = useSelector(selectTradingActiveSection);

    const isFormRoute =
        currentRouteName === 'wallet-trading-buy' ||
        currentRouteName === 'wallet-trading-sell' ||
        currentRouteName === 'wallet-trading-exchange';

    const goToRoute = (route: Route['name']) => () => {
        dispatch(goto({ routeName: route, preserveParams: true }));
    };

    return (
        <PageHeader>
            <Row width="100%" gap={spacings.md}>
                {!isFormRoute && (
                    <IconButton
                        icon="caretLeft"
                        intent="neutral"
                        priority="secondary"
                        size="large"
                        onClick={goToRoute(getBackRoute(currentRouteName, activeSection))}
                        data-testid="@account-subpage/back"
                        tooltip={{ content: <Translation id="TR_BACK" /> }}
                    />
                )}
                <BasicName>
                    <Translation id={fallbackTitle} />
                </BasicName>
                {currentRouteName !== 'wallet-trading-transactions' && (
                    <Box margin={{ left: 'auto' }}>
                        <Button
                            intent="neutral"
                            priority="secondary"
                            margin={{ left: 'auto' }}
                            onClick={goToRoute('wallet-trading-transactions')}
                            data-testid="@trading/menu/wallet-trading-transactions"
                        >
                            <Translation id="TR_TRADING_LAST_TRANSACTIONS" />
                        </Button>
                    </Box>
                )}
            </Row>
        </PageHeader>
    );
};

export const useTradingPageHeader = () => {
    const { translationString } = useTranslation();
    const fallbackTitle: TranslationKey = 'TR_NAV_TRADE';

    const translatedTitle = translationString(fallbackTitle);
    const pageTitle = `Trezor Suite | ${translatedTitle}`;

    useLayout(pageTitle, <TradingPageHeader fallbackTitle={fallbackTitle} />);
};
