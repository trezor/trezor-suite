import { type FC, type PropsWithChildren, type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { selectIsFirmwareAuthenticityCheckEnabledAndHardFailed } from '@suite/authenticity-checks';
import { Translation } from '@suite/intl';
import { type DeviceRootState, selectIsDeviceBackupUnfinished } from '@suite-common/device';
import { Tooltip } from '@trezor/components';

type ReceiveDisabledRootState = DeviceRootState &
    Parameters<typeof selectIsFirmwareAuthenticityCheckEnabledAndHardFailed>[0];

export const useReceiveDisabled = () => {
    const isAuthenticityCheckFailed = useSelector((state: ReceiveDisabledRootState) =>
        selectIsFirmwareAuthenticityCheckEnabledAndHardFailed(state),
    );
    const isDeviceBackupUnfinished = useSelector((state: ReceiveDisabledRootState) =>
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

    const ReceiveDisabledWrapper: FC<PropsWithChildren> =
        tooltipContent !== null
            ? ({ children }) => <Tooltip content={tooltipContent}>{children}</Tooltip>
            : ({ children }) => children;

    return {
        isReceiveDisabled,
        ReceiveDisabledWrapper,
        receiveDisabledTooltipContent: tooltipContent,
    };
};
