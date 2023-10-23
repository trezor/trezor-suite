import { ReactNode } from 'react';

import { Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { Tooltip } from '@trezor/components';

interface AppNavigationTooltipProps {
    children: ReactNode;
    isActiveTab?: boolean;
}

export const AppNavigationTooltip = ({ children, isActiveTab }: AppNavigationTooltipProps) => {
    const { selectedAccount } = useSelector(state => state.wallet);

    const isAccountLoading = selectedAccount.status === 'loading';

    return (
        <Tooltip
            content={
                isAccountLoading &&
                !isActiveTab && <Translation id="TR_UNAVAILABLE_WHILE_LOADING" />
            }
            interactive={false}
            cursor="default"
        >
            <>{children}</>
        </Tooltip>
    );
};
