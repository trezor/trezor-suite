import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import { gotoThunk, selectRouteName, selectSettingsBackRoute } from '@suite/router';
import { useDispatch } from '@suite-common/redux-utils';
import { selectTradingActiveSection } from '@suite-common/trading';
import { Button, Column, H2, Paragraph } from '@trezor/components';

import { getBackRoute } from 'src/views/wallet/trading/common/TradingLayout/tradingPageHeaderUtils';

export const TradingTransactionsEmptyState = () => {
    const dispatch = useDispatch();
    const currentRouteName = useSelector(selectRouteName);
    const previousRoute = useSelector(selectSettingsBackRoute);
    const activeSection = useSelector(selectTradingActiveSection);

    const goToTradeForm = () => {
        dispatch(
            gotoThunk({
                routeName: getBackRoute(currentRouteName, previousRoute.name, activeSection),
                preserveParams: true,
            }),
        );
    };

    return (
        <Column alignItems="center" gap={32} data-testid="@trading/transactions/empty-state">
            <Column alignItems="center" gap={12}>
                <H2>
                    <Translation id="TR_TRADING_TRADE_HISTORY_EMPTY_TITLE" />
                </H2>
                <Paragraph align="center" intent="neutral" priority="secondary">
                    <Translation id="TR_TRADING_TRADE_HISTORY_EMPTY_DESCRIPTION" />
                </Paragraph>
            </Column>
            <Button
                onClick={goToTradeForm}
                data-testid="@trading/transactions/empty-state/back-button"
            >
                <Translation id="TR_TRADING_TRADE_HISTORY_EMPTY_BUTTON" />
            </Button>
        </Column>
    );
};
