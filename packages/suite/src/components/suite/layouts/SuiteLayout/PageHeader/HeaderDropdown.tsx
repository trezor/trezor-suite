import { hasNetworkFeatures } from '@suite-common/wallet-utils';
import { Dropdown, DropdownMenuItemProps, IconName } from '@trezor/components';
import { breakpointThresholds } from '@trezor/styles';
import { EventType, analytics } from '@trezor/suite-analytics';

import { useGoToWithAnalytics } from './useGoToWithAnalytics';
import { useSelector } from '../../../../../hooks/suite';
import { selectSelectedAccount } from '../../../../../reducers/wallet/selectedAccountReducer';
import { useConditionalRender } from '../../../../../support/suite/ConditionalRender';
import { AppNavigationTooltip } from '../../../AppNavigation/AppNavigationTooltip';
import { Translation } from '../../../Translation';

type ActionItem = {
    id: string;
    icon?: IconName;
    callback: () => void;
    title: JSX.Element;
    'data-testid'?: string;
    isHidden?: boolean;
};

type HeaderDropdownProps = {
    isDisabled?: boolean;
    showSignAndVerify?: boolean;
};
export const HeaderDropdown = ({ isDisabled, showSignAndVerify }: HeaderDropdownProps) => {
    const goToWithAnalytics = useGoToWithAnalytics();
    const account = useSelector(selectSelectedAccount);

    const isTradingVisible = useConditionalRender({
        container: 'content',
        minWidth: breakpointThresholds.lg,
    });
    const isSwapVisible = useConditionalRender({
        container: 'content',
        minWidth: breakpointThresholds.md,
    });

    const additionalActions: ActionItem[] = [
        ...(showSignAndVerify
            ? [
                  {
                      id: 'wallet-sign-verify',
                      callback: () => {
                          goToWithAnalytics('wallet-sign-verify', { preserveParams: true });
                      },
                      title: <Translation id="TR_NAV_SIGN_AND_VERIFY" />,
                      icon: 'pencilLine' as const,
                      isHidden: account ? !hasNetworkFeatures(account, 'sign-verify') : false,
                  },
              ]
            : []),
        {
            id: 'wallet-trading-buy',
            callback: () => {
                goToWithAnalytics('wallet-trading-buy', { preserveParams: true });

                analytics.report({
                    type: EventType.TradingNavigate,
                    payload: {
                        action: 'navigate',
                        type: 'buy/sell',
                        from: account ? 'account/header' : 'dashboard/header',
                        networkSymbol: account?.symbol,
                    },
                });
            },
            title: <Translation id="TR_TRADING_BUY_AND_SELL" />,
            icon: 'currencyCircleDollar',
            isHidden: isTradingVisible,
        },
        {
            id: 'wallet-swap',
            callback: () => {
                goToWithAnalytics('wallet-trading-exchange', {
                    preserveParams: true,
                });

                analytics.report({
                    type: EventType.TradingNavigate,
                    payload: {
                        action: 'navigate',
                        type: 'exchange',
                        from: account ? 'account/header' : 'dashboard/header',
                        networkSymbol: account?.symbol,
                    },
                });
            },
            title: <Translation id="TR_TRADING_SWAP" />,
            icon: 'arrowsLeftRight',
            isHidden: isSwapVisible,
        },
    ];

    const visibleAdditionalActions = additionalActions?.filter(action => !action.isHidden);

    return (
        visibleAdditionalActions?.length > 0 && (
            <AppNavigationTooltip>
                <Dropdown
                    placement={{ position: 'bottom', alignment: 'start' }}
                    isDisabled={isDisabled}
                    data-testid="@wallet/menu/extra-dropdown"
                    items={[
                        {
                            key: 'extra',
                            options: visibleAdditionalActions.map<DropdownMenuItemProps>(item => ({
                                key: item.id,
                                onClick: isDisabled ? undefined : item.callback,
                                label: item.title,
                                'data-testid': `@wallet/menu/${item.id}`,
                            })),
                        },
                    ]}
                />
            </AppNavigationTooltip>
        )
    );
};
