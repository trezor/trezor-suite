import { type PropsWithChildren, type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import {
    type AuthenticityChecksRootState,
    selectIsFirmwareAuthenticityCheckEnabledAndHardFailed,
} from '@suite/authenticity-checks';
import { Translation } from '@suite/intl';
import { selectIsDeviceBackupUnfinished } from '@suite-common/device';
import { Tooltip } from '@trezor/components';

export const useReceiveDisabled = () => {
    const isAuthenticityCheckFailed = useSelector((state: AuthenticityChecksRootState) =>
        selectIsFirmwareAuthenticityCheckEnabledAndHardFailed(state),
    );
    const isDeviceBackupUnfinished = useSelector((state: AuthenticityChecksRootState) =>
        selectIsDeviceBackupUnfinished(state),
    );

    const isReceiveDisabled: boolean = isAuthenticityCheckFailed || isDeviceBackupUnfinished;

    const getTooltipContent = (): ReactNode => {
        if (isAuthenticityCheckFailed) {
            return <Translation id="TR_RECEIVE_ADDRESS_SECURITY_CHECK_FAILED" />;
        }
        if (isDeviceBackupUnfinished) {
            return <Translation id="TR_RECEIVE_ADDRESS_FAILED_BACKUP" />;
        }

        return null;
    };
    const tooltipContent = getTooltipContent();

    const ReceiveDisabledWrapper = ({ children }: PropsWithChildren) =>
        tooltipContent !== null ? <Tooltip content={tooltipContent}>{children}</Tooltip> : children;

    return {
        isReceiveDisabled,
        ReceiveDisabledWrapper,
        receiveDisabledTooltipContent: tooltipContent,
    };
};
