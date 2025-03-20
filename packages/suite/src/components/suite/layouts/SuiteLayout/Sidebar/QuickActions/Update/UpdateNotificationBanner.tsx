import { MouseEvent } from 'react';

import { motion } from 'framer-motion';
import styled from 'styled-components';

import { Column, ElevationContext, Icon, Row, Text } from '@trezor/components';
import { Elevation, borders, mapElevationToBackground, spacingsPx } from '@trezor/theme';

import {
    UpdateStatus,
    UpdateStatusDevice,
    UpdateStatusSuite,
    mapDeviceUpdateToClick,
    mapSuiteUpdateToClick,
} from './updateQuickActionTypes';
import { useDiscovery, useDispatch } from '../../../../../../../hooks/suite';
import { Translation, TranslationKey } from '../../../../../Translation';

type ContainerProps = { $elevation: Elevation };

const Container = styled.div<ContainerProps>`
    margin: ${spacingsPx.md};
    display: flex;
    flex-direction: column;
    padding: ${spacingsPx.xs} ${spacingsPx.sm};
    background: ${mapElevationToBackground};
    border-radius: ${borders.radii.sm};
    box-shadow: ${({ theme }) => theme.boxShadowElevated};
    cursor: ${({ onClick }) => (onClick !== undefined ? 'pointer' : undefined)};
`;

const CloseIconBackground = styled.div`
    width: 36px;
    height: 36px;

    display: flex;
    justify-content: center;
    align-items: center;
    background-color: ${({ theme }) => theme.backgroundSurfaceElevation2};
    border-radius: ${borders.radii.full};
    cursor: ${({ onClick }) => (onClick !== undefined ? 'pointer' : undefined)};
`;

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
    const { getDiscoveryStatus } = useDiscovery();
    const discoveryStatus = getDiscoveryStatus();
    const discoveryInProgress = discoveryStatus && discoveryStatus.status === 'loading';

    const translationHeader =
        updateStatusSuite !== 'up-to-date' // Update suite first, because it will contain the newest firmware
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

    const handleOnClose = (e: MouseEvent<HTMLDivElement>) => {
        // Click on whole banner has onClick, so prevent the activation when closing the modal
        e.stopPropagation();
        onClose();
    };

    const variants = {
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
        <ElevationContext baseElevation={1}>
            <motion.div
                variants={variants}
                initial="initial"
                exit="exit"
                animate={['drop', 'shake']}
            >
                <Container
                    $elevation={1}
                    onClick={handleOnClick}
                    data-testid="@notification/update-notification-banner"
                >
                    <Row justifyContent="stretch">
                        <Column flex="1" alignItems="start">
                            <Text>
                                <Translation id={translationHeader} />
                            </Text>
                            <Text variant="primary">
                                <Translation id={translationCallToAction} />
                            </Text>
                        </Column>
                        <CloseIconBackground onClick={handleOnClose}>
                            <Icon name="x" size="medium" />
                        </CloseIconBackground>
                    </Row>
                </Container>
            </motion.div>
        </ElevationContext>
    );
};
