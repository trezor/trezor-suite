import { type MouseEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { type Variants, motion } from 'framer-motion';

import { Translation, type TranslationKey } from '@suite/intl';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Card, Column, ElevationContext, IconButton, Row, Text } from '@trezor/components';

import {
    type UpdateStatus,
    type UpdateStatusDevice,
    type UpdateStatusSuite,
    mapDeviceUpdateToClick,
    mapSuiteUpdateToClick,
} from './updateQuickActionTypes';

type UpdateNotificationBannerProps = {
    updateStatusDevice: UpdateStatusDevice;
    updateStatusSuite: UpdateStatusSuite;
    onClose: () => void;
};

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

export const UpdateNotificationBanner = ({
    updateStatusDevice,
    updateStatusSuite,
    onClose,
}: UpdateNotificationBannerProps) => {
    const dispatch = useDispatch();
    const discoveryInProgress = useSelector(selectHasRunningDiscovery);

    const translationHeader =
        updateStatusSuite !== 'up-to-date'
            ? mapSuiteUpdateStatusToHeaderTranslation[updateStatusSuite]
            : mapDeviceUpdateStatusToTranslation[updateStatusDevice];

    const translationCallToAction =
        mapSuiteUpdateStatusToCallToActionTranslation[
            updateStatusSuite !== 'up-to-date' ? updateStatusSuite : updateStatusDevice
        ];

    if (translationHeader === null || translationCallToAction === null || discoveryInProgress) {
        return null;
    }

    const handleOnClick = () => {
        const onClick =
            updateStatusSuite !== 'up-to-date'
                ? mapSuiteUpdateToClick[updateStatusSuite]
                : mapDeviceUpdateToClick[updateStatusDevice];

        if (onClick !== null) {
            onClick({ dispatch });
            onClose();
        }
    };

    const handleOnClose = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        onClose();
    };

    const variants: Variants = {
        initial: { y: 32, opacity: 0 },
        exit: { y: 32, opacity: 0 },
        drop: {
            y: 0,
            opacity: 1,
            transition: {
                type: 'spring',
                mass: 1,
                stiffness: 266.7,
                damping: 10,
            },
        },
        shake: {
            rotate: [0, -1, 1, 0],
            x: [0, -4, 4, 0],
            transition: {
                duration: 1.2,
                ease: 'easeInOut',
                delay: 10,
            },
        },
    };

    return (
        <ElevationContext baseElevation={0}>
            <motion.div
                variants={variants}
                initial="initial"
                exit="exit"
                animate={['drop', 'shake']}
            >
                <Card
                    onClick={handleOnClick}
                    data-testid="@notification/update-notification-banner"
                    margin={12}
                    paddingType="small"
                    width="auto"
                >
                    <Row gap={12}>
                        <Column flex="1" alignItems="start">
                            <Text>
                                <Translation id={translationHeader} />
                            </Text>
                            <Text intent="brand">
                                <Translation id={translationCallToAction} />
                            </Text>
                        </Column>
                        <IconButton
                            intent="neutral"
                            priority="secondary"
                            icon="x"
                            size="small"
                            onClick={handleOnClose}
                        />
                    </Row>
                </Card>
            </motion.div>
        </ElevationContext>
    );
};
