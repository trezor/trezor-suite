import { JSX } from 'react';

import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { getTradingPrefilledFromAccountData, tradingActions } from '@suite-common/trading';
import { hasNetworkFeatures } from '@suite-common/wallet-utils';
import { Dropdown, DropdownMenuItemProps, IconName } from '@trezor/components';
import { breakpoints } from '@trezor/theme';

import { useAnalytics } from 'src/support/useAnalytics';

import { useGoToWithAnalytics } from './useGoToWithAnalytics';
import { useDispatch, useSelector } from '../../../../../hooks/suite';
import { selectSelectedAccount } from '../../../../../reducers/wallet/selectedAccountReducer';
import { useConditionalRender } from '../../../../../support/suite/ConditionalRender';
import { AppNavigationTooltip } from '../../../AppNavigation/AppNavigationTooltip';

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
    const analytics = useAnalytics();
    const dispatch = useDispatch();
    const goToWithAnalytics = useGoToWithAnalytics();
    const account = useSelector(selectSelectedAccount);

    const isBuyVisible = useConditionalRender({
        container: 'content',
        minWidth: breakpoints.laptop,
    });
    const isSwapVisible = useConditionalRender({
        container: 'content',
        minWidth: breakpoints.tablet,
    });

    const additionalActions: ActionItem[] = [
        ...(showSignAndVerify
            ? [
                  {
                      id: 'wallet-sign-verify',
                      callback: () => {
                          goToWithAnalytics({ routeName: 'wallet-sign-verify', preserveParams: true });
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
        {
            id: 'wallet-swap',
            callback: () => {
                if (account) {
                    dispatch(
                        tradingActions.setTradingFromPrefilledAccount(
                            getTradingPrefilledFromAccountData(account),
                        ),
                    );
                }

                goToWithAnalytics({ routeName: 'wallet-trading-exchange', preserveParams: false });

                analytics.report({
                    type: events.tradeNavigateEvent.name,
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
            isHidden: isSwapVisible || isTradingDisabled,
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
