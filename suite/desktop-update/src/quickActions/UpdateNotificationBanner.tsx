import { useSelector } from 'react-redux';

import { Translation, type TranslationKey } from '@suite/intl';
import { type DeviceRootState } from '@suite-common/device';
import { useDispatch } from '@suite-common/redux-utils';
import { type DiscoveryRootState, selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { SidebarBanner } from '@trezor/product-components';

import { type DesktopUpdateRootState } from '../desktopUpdateReducer';
import { selectUpdateStatus } from './selectUpdateStatus';
import {
    type UpdateStatus,
    type UpdateStatusDevice,
    type UpdateStatusSuite,
    mapDeviceUpdateToClick,
    mapSuiteUpdateToClick,
    mapUpdateStatusToIcon,
} from './updateQuickActionTypes';

const mapDeviceUpdateStatusToTranslation: Record<UpdateStatusDevice, TranslationKey | null> = {
    disconnected: null,
    'up-to-date': null,
    'update-available': 'TR_QUICK_ACTION_UPDATE_POPOVER_TREZOR_UPDATE_AVAILABLE',
};

const mapSuiteUpdateStatusToHeaderTranslation: Record<UpdateStatusSuite, TranslationKey | null> = {
    'update-downloaded-auto-restart-to-update':
        'TR_QUICK_ACTION_UPDATE_POPOVER_APP_HAS_BEEN_UPDATED',
    'update-downloaded-manual': 'TR_QUICK_ACTION_UPDATE_POPOVER_APP_DOWNLOADED',
    'just-updated': 'TR_QUICK_ACTION_UPDATE_POPOVER_APP_HAS_BEEN_UPDATED',
    'up-to-date': null,
    'update-available': 'TR_QUICK_ACTION_UPDATE_POPOVER_APP_UPDATE_AVAILABLE',
};

const mapSuiteUpdateStatusToCallToActionTranslation: Record<UpdateStatus, TranslationKey | null> = {
    disconnected: null,
    'just-updated': 'TR_QUICK_ACTION_UPDATE_POPOVER_WHATS_NEW',
    'up-to-date': null,
    'update-available': 'TR_QUICK_ACTION_UPDATE_POPOVER_CLICK_TO_START_UPDATE',
    'update-downloaded-auto-restart-to-update':
        'TR_QUICK_ACTION_UPDATE_POPOVER_CLICK_TO_RESTART_AND_UPDATE',
    'update-downloaded-manual': 'TR_QUICK_ACTION_UPDATE_POPOVER_CLICK_TO_START_UPDATE',
};

type UpdateNotificationBannerRootState = DesktopUpdateRootState &
    DeviceRootState &
    DiscoveryRootState;

export const selectShouldShowUpdateNotificationBanner = (
    state: UpdateNotificationBannerRootState,
) => {
    if (selectHasRunningDiscovery(state)) {
        return false;
    }

    const { updateStatusDevice, updateStatusSuite } = selectUpdateStatus(state);

    const isUpdateAvailable =
        updateStatusSuite !== 'up-to-date' ||
        !['up-to-date', 'disconnected'].includes(updateStatusDevice);

    return isUpdateAvailable;
};

type UpdateNotificationBannerProps = {
    onDismiss: () => void;
};

export const UpdateNotificationBanner = ({ onDismiss }: UpdateNotificationBannerProps) => {
    const dispatch = useDispatch();
    const updateStatusData: {
        updateStatus: UpdateStatus;
        updateStatusDevice: UpdateStatusDevice;
        updateStatusSuite: UpdateStatusSuite;
    } = useSelector(selectUpdateStatus);

    const { updateStatus, updateStatusDevice, updateStatusSuite } = updateStatusData;

    const shouldUseSuiteUpdateStatus = updateStatusSuite !== 'up-to-date';

    const translationHeader = shouldUseSuiteUpdateStatus
        ? mapSuiteUpdateStatusToHeaderTranslation[updateStatusSuite]
        : mapDeviceUpdateStatusToTranslation[updateStatusDevice];

    const translationCallToAction =
        mapSuiteUpdateStatusToCallToActionTranslation[
            shouldUseSuiteUpdateStatus ? updateStatusSuite : updateStatusDevice
        ];

    if (translationHeader === null || translationCallToAction === null) {
        return null;
    }

    const handleClose = () => {
        onDismiss();
    };

    const handleOnClick = () => {
        const onClick = shouldUseSuiteUpdateStatus
            ? mapSuiteUpdateToClick[updateStatusSuite]
            : mapDeviceUpdateToClick[updateStatusDevice];

        if (onClick !== null) {
            onClick({ dispatch });
            handleClose();
        }
    };

    return (
        <SidebarBanner
            animate={['drop', 'shake']}
            ctaLabel={<Translation id={translationCallToAction} />}
            closeLabel={<Translation id="TR_DISMISS" />}
            heading={<Translation id={translationHeader} />}
            icon={mapUpdateStatusToIcon[updateStatus]}
            onClick={handleOnClick}
            onClose={handleClose}
            data-testid="@notification/update-notification-banner"
        />
    );
};
