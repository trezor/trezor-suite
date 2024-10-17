import { Row, variables } from '@trezor/components';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';
import { analytics, EventType } from '@trezor/suite-analytics';
import { goto } from 'src/actions/suite/routerActions';
import { AppNavigationTooltip } from 'src/components/suite/AppNavigation/AppNavigationTooltip';
import { Translation } from 'src/components/suite/Translation';
import { useDispatch, useSelector } from 'src/hooks/suite';
import styled from 'styled-components';
import { HeaderActionButton } from 'src/components/suite/layouts/SuiteLayout/PageHeader/HeaderActionButton';
import { selectDevice } from '@suite-common/wallet-core';
import { spacings } from '@trezor/theme';
import { SelectedAccountStatus } from '@suite-common/wallet-types';

// instant without computing the layout
const ShowOnLargeDesktopWrapper = styled.div`
    ${variables.SCREEN_QUERY.BELOW_DESKTOP} {
        display: none;
    }
`;

interface TradeActionsProps {
    analyticsEventType: EventType.AccountsActions | EventType.MenuActions;
    selectedAccount?: SelectedAccountStatus;
}

export const TradeActions = ({ analyticsEventType, selectedAccount }: TradeActionsProps) => {
    const dispatch = useDispatch();
    const account = selectedAccount?.account;
    const device = useSelector(selectDevice);

    const goToWithAnalytics = (...[routeName, options]: Parameters<typeof goto>) => {
        if (analyticsEventType === EventType.MenuActions) {
            analytics.report({
                type: analyticsEventType,
                payload: { type: routeName },
            });
        }

        if (analyticsEventType === EventType.AccountsActions && account?.symbol) {
            analytics.report({
                type: analyticsEventType,
                payload: { symbol: account?.symbol, action: routeName },
            });
        }

        dispatch(goto(routeName, options));
    };

    const isAccountLoading = selectedAccount ? selectedAccount.status === 'loading' : false;

    return (
        <Row gap={spacings.xxs}>
            <AppNavigationTooltip>
                <ShowOnLargeDesktopWrapper>
                    <HeaderActionButton
                        icon="currencyCircleDollar"
                        onClick={() => {
                            goToWithAnalytics('wallet-coinmarket-buy', {
                                preserveParams: true,
                            });
                        }}
                        data-testid="@wallet/menu/wallet-coinmarket-buy"
                        variant="tertiary"
                        size="small"
                        isDisabled={isAccountLoading}
                    >
                        <Translation id="TR_COINMARKET_BUY_AND_SELL" />
                    </HeaderActionButton>
                </ShowOnLargeDesktopWrapper>
                {!hasBitcoinOnlyFirmware(device) && (
                    <HeaderActionButton
                        icon="arrowsLeftRight"
                        onClick={() => {
                            goToWithAnalytics('wallet-coinmarket-exchange', {
                                preserveParams: true,
                            });
                        }}
                        data-testid="@wallet/menu/wallet-coinmarket-exchange"
                        variant="tertiary"
                        size="small"
                        isDisabled={isAccountLoading}
                    >
                        <Translation id="TR_COINMARKET_SWAP" />
                    </HeaderActionButton>
                )}
            </AppNavigationTooltip>
        </Row>
    );
};
