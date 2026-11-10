import { type JSX } from 'react';

import { selectSelectedAccount } from '@suite/account';
import { Translation } from '@suite/intl';
import { hasNetworkFeatures } from '@suite-common/wallet-utils';
import { isWalletConnectSupportedNetwork } from '@suite-common/walletconnect';
import { Dropdown, type DropdownMenuItemProps, type IconComponent } from '@trezor/components';
import { PencilLineIcon, WalletConnectIcon } from '@trezor/icons';

import { useGoToWithAnalytics } from './useGoToWithAnalytics';
import { useSelector } from '../../../../../hooks/suite';
import { AppNavigationTooltip } from '../../../AppNavigation/AppNavigationTooltip';

type ActionItem = {
    id: string;
    icon?: IconComponent;
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
                      icon: PencilLineIcon,
                      isHidden: account ? !hasNetworkFeatures(account, 'sign-verify') : false,
                  },
              ]
            : []),
        {
            id: 'settings-connected-apps',
            callback: () => {
                goToWithAnalytics({
                    routeName: 'settings-connected-apps',
                    preserveParams: true,
                });
            },
            title: <Translation id="TR_WALLETCONNECT" />,
            icon: WalletConnectIcon,
            isHidden: account ? !isWalletConnectSupportedNetwork(account.symbol) : true,
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
