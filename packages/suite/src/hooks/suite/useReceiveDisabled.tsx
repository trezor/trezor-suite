import { type FC, type PropsWithChildren, type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { selectIsDeviceBackupUnfinished } from '@suite-common/device';
import { Tooltip } from '@trezor/components';

import { selectIsFirmwareAuthenticityCheckEnabledAndHardFailed } from 'src/selectors/suite/suiteAuthenticityChecksSelectors';

import { useSelector } from './useSelector';

export const useReceiveDisabled = () => {
    const isAuthenticityCheckFailed = useSelector(
        selectIsFirmwareAuthenticityCheckEnabledAndHardFailed,
    );
    const isDeviceBackupUnfinished = useSelector(selectIsDeviceBackupUnfinished);

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
