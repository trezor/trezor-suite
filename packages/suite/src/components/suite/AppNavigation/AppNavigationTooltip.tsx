import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { useSelector } from '@suite-common/redux-utils';
import { Tooltip } from '@trezor/components';

interface AppNavigationTooltipProps {
    children: ReactNode;
    isActiveTab?: boolean;
}

export const AppNavigationTooltip = ({ children, isActiveTab }: AppNavigationTooltipProps) => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);

    const isAccountLoading = selectedAccount.status === 'loading';

    return (
        <Tooltip
            content={
                isAccountLoading &&
                !isActiveTab && <Translation id="TR_UNAVAILABLE_WHILE_LOADING" />
            }
            cursor="default"
        >
            <>{children}</>
        </Tooltip>
    );
};
