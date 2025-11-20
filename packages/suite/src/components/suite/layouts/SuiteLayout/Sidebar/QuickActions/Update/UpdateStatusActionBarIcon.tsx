import { useDispatch } from 'react-redux';

import { ManagedTooltipProps } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';
import { mapTrezorModelToIcon } from '@trezor/product-components';

import { selectDiscoveryOverallStatus } from 'src/utils/wallet/selectDiscoveryOverallStatus';

import { useDevice, useSelector } from '../../../../../../../hooks/suite';
import { QuickActionButton } from '../QuickActionButton';
import { UpdateTooltip } from './UpdateTooltip';
import {
    mapDeviceUpdateToClick,
    mapSuiteUpdateToClick,
    mapUpdateStatusToIcon,
    mapUpdateStatusToSubIconIntent,
} from './updateQuickActionTypes';
import { useUpdateStatus } from './useUpdateStatus';

type UpdateStatusActionBarIconProps = {
    showUpdateBannerNotification: boolean;
    hideDeviceUpdateStatusBar?: boolean;
};

export const UpdateStatusActionBarIcon = ({
    showUpdateBannerNotification,
    hideDeviceUpdateStatusBar,
}: UpdateStatusActionBarIconProps) => {
    const { updateStatus, updateStatusDevice, updateStatusSuite } = useUpdateStatus();
    const discoveryStatus = useSelector(selectDiscoveryOverallStatus);
    const discoveryInProgress = discoveryStatus && discoveryStatus.status === 'loading';

    const { device } = useDevice();
    const dispatch = useDispatch();

    const updateSubIcon = mapUpdateStatusToIcon[updateStatus];

    const isDesktopSuite = isDesktop();

    const suiteOnClick = mapSuiteUpdateToClick[updateStatusSuite];
    const deviceOnClick = mapDeviceUpdateToClick[updateStatusDevice];

    const suiteOnClickHandler = suiteOnClick ? () => suiteOnClick({ dispatch }) : undefined;
    const deviceOnClickHandler = deviceOnClick ? () => deviceOnClick({ dispatch }) : undefined;

    const handleClick = () => {
        if (updateStatusSuite !== 'up-to-date') {
            suiteOnClickHandler?.();
        } else if (updateStatusDevice !== 'up-to-date') {
            deviceOnClickHandler?.();
        }
    };

    const displayDeviceUpdateStatusBar = !hideDeviceUpdateStatusBar && !discoveryInProgress;

    const anyUpdateInfoAvailable = isDesktopSuite || displayDeviceUpdateStatusBar;

    const getTooltip = (): Partial<ManagedTooltipProps> => ({
        isActive: !showUpdateBannerNotification,
        content: (
            <UpdateTooltip
                displayDeviceUpdateStatus={displayDeviceUpdateStatusBar}
                updateStatusDevice={updateStatusDevice}
                onClickSuite={suiteOnClickHandler}
                updateStatusSuite={updateStatusSuite}
                onClickDevice={deviceOnClickHandler}
            />
        ),
    });

    const tooltip = getTooltip();

    if (!anyUpdateInfoAvailable || !device?.features) {
        return null;
    }

    return (
        <QuickActionButton
            onClick={handleClick}
            tooltip={{ content: tooltip?.content, ...tooltip }}
            iconName={
                updateStatusSuite !== 'up-to-date'
                    ? 'trezorLogo'
                    : mapTrezorModelToIcon[device?.features?.internal_model]
            }
            subIconIntent={mapUpdateStatusToSubIconIntent[updateStatus]}
            subIconName={updateSubIcon}
        />
    );
};
