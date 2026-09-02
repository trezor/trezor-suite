import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import { type Route, goto, selectRouteName, selectSettingsBackRoute } from '@suite/router';
import { useDispatch } from '@suite-common/redux-utils';
import { selectTradingActiveSection } from '@suite-common/trading';
import { Box, Button, IconButton, Row } from '@trezor/components';
import { CaretLeftIcon } from '@trezor/icons';

import { PageHeader } from 'src/components/suite/layouts/SuiteLayout';
import { BasicName } from 'src/components/suite/layouts/SuiteLayout/PageHeader/PageNames/BasicName';
import { useLayout, useSelector } from 'src/hooks/suite';

import {
    getBackRoute,
    getTradingHeaderTitle,
    isTradingTopLevelRoute,
} from './tradingPageHeaderUtils';

type TradingPageHeaderProps = {
    title: TranslationKey;
};

const TradingPageHeader = ({ title }: TradingPageHeaderProps) => {
    const dispatch = useDispatch();
    const currentRouteName = useSelector(selectRouteName);
    const previousRoute = useSelector(selectSettingsBackRoute);
    const activeSection = useSelector(selectTradingActiveSection);

    const isTopLevelRoute = isTradingTopLevelRoute(currentRouteName);

    const goToRoute = (route: Route['name']) => () => {
        dispatch(goto({ routeName: route, preserveParams: true }));
    };

    return (
        <PageHeader>
            <Row width="100%" gap={16}>
                {!isTopLevelRoute && (
                    <IconButton
                        icon={CaretLeftIcon}
                        intent="neutral"
                        priority="secondary"
                        size="large"
                        onClick={goToRoute(
                            getBackRoute(currentRouteName, previousRoute.name, activeSection),
                        )}
                        data-testid="@account-subpage/back"
                        tooltip={{ content: <Translation id="TR_BACK" /> }}
                    />
                )}
                <BasicName data-testid="@trading/page-header/title">
                    <Translation id={title} />
                </BasicName>
                {isTopLevelRoute && (
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
    const currentRouteName = useSelector(selectRouteName);

    const title = getTradingHeaderTitle(currentRouteName);
    const pageTitle = `Trezor Suite | ${translationString(title)}`;

    useLayout(pageTitle, <TradingPageHeader title={title} />);
};
