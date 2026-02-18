import { useDispatch } from 'react-redux';

import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { isDesktop } from '@trezor/env-utils';
import { mapTrezorModelToIcon } from '@trezor/product-components';

import { useDevice, useSelector } from 'src/hooks/suite';

import { QuickActionButton } from '../QuickActionButton';
import { UpdateTooltip } from './UpdateTooltip';
import {
    mapDeviceUpdateToClick,
    mapSuiteUpdateToClick,
    mapUpdateStatusToIcon,
    mapUpdateStatusToIntent,
} from './updateQuickActionTypes';
import { useUpdateStatus } from './useUpdateStatus';

type UpdateStatusActionBarIconProps = {
    hideUpdateQuickAction: boolean;
};

export const UpdateStatusActionBarIcon = ({
    hideUpdateQuickAction,
}: UpdateStatusActionBarIconProps) => {
    const { updateStatus, updateStatusDevice, updateStatusSuite } = useUpdateStatus();
    const discoveryInProgress = useSelector(selectHasRunningDiscovery);
    const displayDeviceUpdateStatusBar = !discoveryInProgress;

    const { device } = useDevice();
    const dispatch = useDispatch();

    const updateSubIcon = mapUpdateStatusToIcon[updateStatus];

    const isDesktopSuite = isDesktop();

    const suiteOnClick = mapSuiteUpdateToClick[updateStatusSuite];
    const deviceOnClick = displayDeviceUpdateStatusBar
        ? mapDeviceUpdateToClick[updateStatusDevice]
        : null;

    const suiteOnClickHandler = suiteOnClick ? () => suiteOnClick({ dispatch }) : undefined;
    const deviceOnClickHandler = deviceOnClick ? () => deviceOnClick({ dispatch }) : undefined;

    const handleClick = () => {
        if (updateStatusSuite !== 'up-to-date') {
            suiteOnClickHandler?.();
        } else if (updateStatusDevice !== 'up-to-date') {
            deviceOnClickHandler?.();
        }
    };

    const anyUpdateInfoAvailable = isDesktopSuite || displayDeviceUpdateStatusBar;

    if (!anyUpdateInfoAvailable) {
        return null;
    }

    return (
        <QuickActionButton
            onClick={handleClick}
            tooltip={{
                isActive: !hideUpdateQuickAction,
                content: (
                    <UpdateTooltip
                        displayDeviceUpdateStatus={displayDeviceUpdateStatusBar}
                        updateStatusDevice={updateStatusDevice}
                        onClickSuite={suiteOnClickHandler}
                        updateStatusSuite={updateStatusSuite}
                        onClickDevice={deviceOnClickHandler}
                    />
                ),
            }}
            iconName={
                updateStatusSuite !== 'up-to-date' || !device?.features
                    ? 'trezorLogo'
                    : mapTrezorModelToIcon[device.features.internal_model]
            }
            subIconIntent={mapUpdateStatusToIntent[updateStatus]}
            subIconName={updateSubIcon}
        />
    );
};
