import React from 'react';

import { Button, Tooltip } from '@trezor/components';
import { DeviceModel } from '@trezor/device-utils';

interface DeviceButtonProps {
    isDisabled?: boolean;
    isLoading?: boolean;
    onClick: () => void;
    deviceModel: Exclude<DeviceModel, DeviceModel.UNKNOWN>;
    tooltipContent?: React.ReactNode;
    children: React.ReactNode;
}

export const DeviceButton = ({
    isDisabled,
    isLoading,
    onClick,
    deviceModel,
    tooltipContent,
    children,
}: DeviceButtonProps) => (
    <Tooltip maxWidth={285} content={tooltipContent}>
        <Button
            isDisabled={isDisabled}
            isLoading={isLoading}
            onClick={onClick}
            icon={`TREZOR_T${deviceModel}`}
        >
            {children}
        </Button>
    </Tooltip>
);
