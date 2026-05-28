import { type JSX } from 'react';

import { selectSelectedAccount } from '@suite/account';
import { Translation } from '@suite/intl';
import { hasNetworkFeatures } from '@suite-common/wallet-utils';
import { Dropdown, type DropdownMenuItemProps, type IconName } from '@trezor/components';

import { AppNavigationTooltip } from 'src/components/suite/AppNavigation/AppNavigationTooltip';
import { useSelector } from 'src/hooks/suite';

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
                      icon: 'pencilLine' as const,
                      isHidden: account ? !hasNetworkFeatures(account, 'sign-verify') : false,
                  },
              ]
            : []),
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
