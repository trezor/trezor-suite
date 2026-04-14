import { useDispatch, useSelector } from 'react-redux';

import { selectSelectedDevice } from '@suite-common/device';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { isDesktop } from '@trezor/env-utils';
import { QuickActionButton, mapTrezorModelToIcon } from '@trezor/product-components';

import { UpdateTooltip } from './UpdateTooltip';
import { selectUpdateStatus } from './selectUpdateStatus';
import {
    mapDeviceUpdateToClick,
    mapSuiteUpdateToClick,
    mapUpdateStatusToIcon,
    mapUpdateStatusToIntent,
} from './updateQuickActionTypes';

type UpdateStatusActionBarIconProps = {
    isSidebarCollapsed: boolean;
};

export const UpdateStatusActionBarIcon = ({
    isSidebarCollapsed,
}: UpdateStatusActionBarIconProps) => {
    const discoveryInProgress = useSelector(selectHasRunningDiscovery);

    const { updateStatus, updateStatusDevice, updateStatusSuite } = useSelector(selectUpdateStatus);
    const displayDeviceUpdateStatusBar = !discoveryInProgress;
    const hideUpdateQuickAction =
        !isSidebarCollapsed &&
        (updateStatusSuite !== 'up-to-date' ||
            !['up-to-date', 'disconnected'].includes(updateStatusDevice));

    const device = useSelector(selectSelectedDevice);
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
