import { type JSX } from 'react';

import { selectSelectedAccount } from '@suite/account';
import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { getTradingPrefilledFromAccountData, tradingActions } from '@suite-common/trading';
import { hasNetworkFeatures } from '@suite-common/wallet-utils';
import { Dropdown, type DropdownMenuItemProps, type IconName } from '@trezor/components';
import { breakpoints } from '@trezor/theme';

import { AppNavigationTooltip } from 'src/components/suite/AppNavigation/AppNavigationTooltip';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useConditionalRender } from 'src/support/suite/ConditionalRender';

import { useGoToWithAnalytics } from './useGoToWithAnalytics';

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
    isTradingDisabled?: boolean;
    showSignAndVerify?: boolean;
};
export const HeaderDropdown = ({
    isDisabled,
    isTradingDisabled,
    showSignAndVerify,
}: HeaderDropdownProps) => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const dispatch = useDispatch();
    const goToWithAnalytics = useGoToWithAnalytics();
    const account = useSelector(selectSelectedAccount);

    const isBuyVisible = useConditionalRender({
        container: 'content',
        minWidth: breakpoints.laptop,
    });

    const additionalActions: ActionItem[] = [
        ...(showSignAndVerify
            ? [
                  {
                      id: 'wallet-sign-verify',
                      callback: () => {
                          goToWithAnalytics({
                              routeName: 'wallet-sign-verify',
                              preserveParams: true,
                          });
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
                if (account) {
                    dispatch(
                        tradingActions.setTradingFromPrefilledAccount(
                            getTradingPrefilledFromAccountData(account),
                        ),
                    );
                }

                goToWithAnalytics({ routeName: 'wallet-trading-buy' });

                analytics.report({
                    type: events.tradeNavigateEvent.name,
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
            isHidden: isBuyVisible || isTradingDisabled,
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
                    tooltip={{ content: <Translation id="TR_SHOW_MORE" />, placement: 'left' }}
                    items={visibleAdditionalActions.map<DropdownMenuItemProps>(item => ({
                        key: item.id,
                        onClick: isDisabled ? undefined : item.callback,
                        label: item.title,
                        'data-testid': `@wallet/menu/${item.id}`,
                    }))}
                />
            </AppNavigationTooltip>
        )
    );
};
