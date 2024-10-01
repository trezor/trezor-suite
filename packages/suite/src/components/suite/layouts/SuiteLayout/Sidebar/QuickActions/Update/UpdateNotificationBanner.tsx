import styled from 'styled-components';
import { Column, ElevationContext, Icon, Row, Text } from '@trezor/components';
import { borders, Elevation, mapElevationToBackground, spacingsPx, zIndices } from '@trezor/theme';
import {
    UpdateStatus,
    UpdateStatusSuite,
    UpdateStatusDevice,
    mapSuiteUpdateToClick,
    mapDeviceUpdateToClick,
} from './updateQuickActionTypes';
import { Translation, TranslationKey } from '../../../../../Translation';
import { useDispatch } from '../../../../../../../hooks/suite';
import { MouseEvent } from 'react';
import { createPortal } from 'react-dom';

type ContainerProps = { $elevation: Elevation };

const Container = styled.div<ContainerProps>`
    position: absolute;
    bottom: 56px;
    left: ${spacingsPx.xs};
    z-index: ${zIndices.navigationBar};
    display: flex;
    flex-direction: column;
    width: 262px;
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

    const translationHeader =
        updateStatusSuite !== 'up-to-date' // Update suite first, because it will contain the newest firmware
            ? mapSuiteUpdateStatusToHeaderTranslation[updateStatusSuite]
            : mapDeviceUpdateStatusToTranslation[updateStatusDevice];

    const translationCallToAction =
        mapSuiteUpdateStatusToCallToActionTranslation[
            updateStatusSuite !== 'up-to-date' ? updateStatusSuite : updateStatusDevice
        ];

    if (translationHeader === null || translationCallToAction === null) {
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
        e.preventDefault();
        e.stopPropagation();
        onClose();
    };

    return createPortal(
        <ElevationContext baseElevation={1}>
            <Container $elevation={1} onClick={handleOnClick}>
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
        </ElevationContext>,
        document.body,
    );
};
