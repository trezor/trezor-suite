import { ReactNode } from 'react';

import { Button, Tooltip } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/connect';

interface DeviceButtonProps {
    isDisabled?: boolean;
    isLoading?: boolean;
    onClick: () => void;
    deviceModelInternal: DeviceModelInternal;
    tooltipContent?: ReactNode;
    children: ReactNode;
}

export const DeviceButton = ({
    isDisabled,
    isLoading,
    onClick,
    deviceModelInternal,
    tooltipContent,
    children,
}: DeviceButtonProps) => (
    <Tooltip maxWidth={285} content={tooltipContent}>
        <Button
            isDisabled={isDisabled}
            isLoading={isLoading}
            onClick={onClick}
            icon={`TREZOR_${deviceModelInternal}`}
        >
            {children}
        </Button>
    </Tooltip>
);
