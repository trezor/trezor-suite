import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { Translation, type TranslationKey } from '@suite/intl';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Text } from '@trezor/components';
import { SidebarBanner } from '@trezor/product-components';

import { selectUpdateStatus } from './selectUpdateStatus';
import {
    type UpdateStatus,
    type UpdateStatusDevice,
    type UpdateStatusSuite,
    mapDeviceUpdateToClick,
    mapSuiteUpdateToClick,
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

export const UpdateNotificationBanner = () => {
    const [closedNotificationDevice, setClosedNotificationDevice] = useState(false);
    const [closedNotificationSuite, setClosedNotificationSuite] = useState(false);
    const [isBannerVisible, setIsBannerVisible] = useState(true);

    const dispatch = useDispatch();
    const discoveryInProgress = useSelector(selectHasRunningDiscovery);
    const { updateStatusDevice, updateStatusSuite } = useSelector(selectUpdateStatus);

    const isUpdateAvailable =
        (updateStatusSuite !== 'up-to-date' && !closedNotificationSuite) ||
        (!['up-to-date', 'disconnected'].includes(updateStatusDevice) && !closedNotificationDevice);
    const showUpdateBannerNotification = isBannerVisible && isUpdateAvailable;

    const translationHeader =
        updateStatusSuite !== 'up-to-date'
            ? mapSuiteUpdateStatusToHeaderTranslation[updateStatusSuite]
            : mapDeviceUpdateStatusToTranslation[updateStatusDevice];

    const translationCallToAction =
        mapSuiteUpdateStatusToCallToActionTranslation[
            updateStatusSuite !== 'up-to-date' ? updateStatusSuite : updateStatusDevice
        ];

    const handleClose = () => {
        if (updateStatusSuite !== 'up-to-date') {
            setClosedNotificationSuite(true);
        }
        if (updateStatusDevice !== 'up-to-date') {
            setClosedNotificationDevice(true);
        }

        setIsBannerVisible(false);
    };

    if (
        !showUpdateBannerNotification ||
        translationHeader === null ||
        translationCallToAction === null ||
        discoveryInProgress
    ) {
        return null;
    }

    const handleOnClick = () => {
        const onClick =
            updateStatusSuite !== 'up-to-date'
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
            onClick={handleOnClick}
            onClose={handleClose}
            data-testid="@notification/update-notification-banner"
        >
            <Text>
                <Translation id={translationHeader} />
            </Text>
            <Text intent="brand">
                <Translation id={translationCallToAction} />
            </Text>
        </SidebarBanner>
    );
};
