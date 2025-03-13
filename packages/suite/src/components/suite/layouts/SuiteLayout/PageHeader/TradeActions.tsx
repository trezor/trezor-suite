import { selectSelectedDevice } from '@suite-common/wallet-core';
import { SelectedAccountStatus } from '@suite-common/wallet-types';
import { Row } from '@trezor/components';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';
import { breakpointThresholds } from '@trezor/styles';
import { EventType, analytics } from '@trezor/suite-analytics';
import { spacings } from '@trezor/theme';

import { goto } from 'src/actions/suite/routerActions';
import { AppNavigationTooltip } from 'src/components/suite/AppNavigation/AppNavigationTooltip';
import { Translation } from 'src/components/suite/Translation';
import { HeaderActionButton } from 'src/components/suite/layouts/SuiteLayout/PageHeader/HeaderActionButton';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectIsAccountTabPage, selectRouteName } from 'src/reducers/suite/routerReducer';
import { ConditionalRender } from 'src/support/suite/ConditionalRender';

interface TradeActionsProps {
    selectedAccount?: SelectedAccountStatus;
}

export const TradeActions = ({ selectedAccount }: TradeActionsProps) => {
    const dispatch = useDispatch();
    const account = selectedAccount?.account;
    const device = useSelector(selectSelectedDevice);
    const isAccountTabPage = useSelector(selectIsAccountTabPage);
    const currentRouteName = useSelector(selectRouteName);

    const goToWithAnalytics = (...[routeName, options]: Parameters<typeof goto>) => {
        if (currentRouteName === 'suite-index') {
            analytics.report({
                type: EventType.DashboardActions,
                payload: { type: routeName },
            });
        }

        if (isAccountTabPage && account?.symbol) {
            analytics.report({
                type: EventType.AccountsActions,
                payload: { symbol: account?.symbol, action: routeName },
            });
        }

        dispatch(goto(routeName, options));
    };

    const isAccountLoading = selectedAccount ? selectedAccount.status === 'loading' : false;

    return (
        <Row gap={spacings.xxs}>
            <AppNavigationTooltip>
                <ConditionalRender container="content" minWidth={breakpointThresholds.lg}>
                    <HeaderActionButton
                        icon="currencyCircleDollar"
                        onClick={() => {
                            goToWithAnalytics('wallet-trading-buy', {
                                preserveParams: true,
                            });
                        }}
                        data-testid="@wallet/menu/wallet-trading-buy"
                        variant="tertiary"
                        size="small"
                        isDisabled={isAccountLoading}
                    >
                        <Translation id="TR_TRADING_BUY_AND_SELL" />
                    </HeaderActionButton>
                </ConditionalRender>
                {!hasBitcoinOnlyFirmware(device) && (
                    <ConditionalRender container="content" minWidth={breakpointThresholds.md}>
                        <HeaderActionButton
                            icon="arrowsLeftRight"
                            onClick={() => {
                                goToWithAnalytics('wallet-trading-exchange', {
                                    preserveParams: true,
                                });
                            }}
                            data-testid="@wallet/menu/wallet-trading-exchange"
                            variant="tertiary"
                            size="small"
                            isDisabled={isAccountLoading}
                        >
                            <Translation id="TR_TRADING_SWAP" />
                        </HeaderActionButton>
                    </ConditionalRender>
                )}
            </AppNavigationTooltip>
        </Row>
    );
};
