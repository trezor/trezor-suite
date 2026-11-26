import { type ReactNode } from 'react';

import { selectIsSelectedAccountLoading } from '@suite/account';
import { Translation } from '@suite/intl';
import { Tooltip } from '@trezor/components';

import { useSelector } from '#src/hooks/suite/useSelector';

interface AppNavigationTooltipProps {
    children: ReactNode;
    isActiveTab?: boolean;
}

export const AppNavigationTooltip = ({ children, isActiveTab }: AppNavigationTooltipProps) => {
    const isAccountLoading = useSelector(selectIsSelectedAccountLoading);

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
