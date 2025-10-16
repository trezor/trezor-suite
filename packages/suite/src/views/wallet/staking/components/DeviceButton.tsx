import { ReactNode } from 'react';

import { NewButton, Tooltip } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/device-utils';
import { mapTrezorModelToIcon } from '@trezor/product-components';

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
        <NewButton
            isDisabled={isDisabled}
            isLoading={isLoading}
            onClick={onClick}
            iconLeft={mapTrezorModelToIcon[deviceModelInternal]}
        >
            {children}
        </NewButton>
    </Tooltip>
);
