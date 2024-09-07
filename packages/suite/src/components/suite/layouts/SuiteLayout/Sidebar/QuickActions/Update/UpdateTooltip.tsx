import styled, { useTheme } from 'styled-components';
import { useDevice, useSelector } from '../../../../../../../hooks/suite';
import { Column, Row, Icon, iconSizes, Text, getColorForIconVariant } from '@trezor/components';
import { ReactNode } from 'react';
import {
    mapUpdateStatusToVariant,
    UpdateStatus,
    UpdateVariant,
    mapUpdateStatusToIcon,
} from './updateQuickActionTypes';
import { Translation } from '../../../../../Translation';
import { borders, spacings, spacingsPx } from '@trezor/theme';
import { TranslationKey } from '@suite-common/intl-types';
import { getFirmwareVersion } from '@trezor/device-utils';
import { isDesktop } from '@trezor/env-utils';
import { mapTrezorModelToIcon } from '@trezor/product-components';

type IconCircleWrapperProps = {
    $variant: UpdateVariant;
};

const IconCircleWrapper = styled.div<IconCircleWrapperProps>`
    display: flex;
    align-items: center;
    justify-content: center;

    width: 14px;
    height: 14px;

    background-color: ${({ theme, $variant }) =>
        getColorForIconVariant({ theme, variant: $variant })};
    border-radius: ${borders.radii.full};
    border: 1px solid ${({ theme }) => theme['borderElevationNegative']};
    padding: ${spacingsPx.xxxs};
`;

type UpdateRowProps = {
    children: ReactNode;
    leftItem: ReactNode;
    updateStatus: UpdateStatus;
    header: ReactNode;
};

const UpdateRow = ({ leftItem, updateStatus, children, header }: UpdateRowProps) => {
    const theme = useTheme();

    const variant = mapUpdateStatusToVariant[updateStatus];

    return (
        <Row gap={spacings.xs}>
            {leftItem}
            <Column alignItems="start">
                <Text>{header}</Text>
                <Row gap={spacings.xxs}>
                    <IconCircleWrapper $variant={variant}>
                        <Icon
                            name={mapUpdateStatusToIcon[updateStatus]}
                            color={theme.iconDefaultInverted}
                            size={iconSizes.extraSmall}
                        />
                    </IconCircleWrapper>
                    <Text variant={variant}>{children}</Text>
                </Row>
            </Column>
        </Row>
    );
};

const SuiteIconRectangle = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding-left: 0.5px;
    width: ${spacingsPx.xl};
    height: ${spacingsPx.xl};

    border-radius: 6px;
    background-color: ${({ theme }) => theme.iconDefault};
`;

const mapUpdateStatusToTranslation: Record<UpdateStatus, TranslationKey> = {
    'up-to-date': 'TR_QUICK_ACTION_TOOLTIP_UP_TO_DATE',
    'update-available': 'TR_QUICK_ACTION_TOOLTIP_UPDATE_AVAILABLE',
    'restart-to-update': 'TR_QUICK_ACTION_TOOLTIP_RESTART_TO_UPDATE',
    'just-updated': 'TR_QUICK_ACTION_TOOLTIP_JUST_UPDATED',
};

type DeviceRowProps = {
    updateStatus: UpdateStatus;
};

const DeviceRow = ({ updateStatus }: DeviceRowProps) => {
    const { device } = useDevice();

    if (device?.features === undefined) {
        return null;
    }

    const firmwareCurrentVersion = getFirmwareVersion(device);
    const firmwareNewVersion = device.firmwareRelease?.release?.version?.join('.');

    return (
        <UpdateRow
            leftItem={
                <Icon
                    name={mapTrezorModelToIcon[device.features.internal_model]}
                    size={iconSizes.large}
                />
            }
            updateStatus={updateStatus}
            header={<Translation id="TR_QUICK_ACTION_TOOLTIP_TREZOR_DEVICE" />}
        >
            <Translation
                id={mapUpdateStatusToTranslation[updateStatus]}
                values={{
                    currentVersion: firmwareCurrentVersion,
                    newVersion: firmwareNewVersion,
                }}
            />
        </UpdateRow>
    );
};

type SuiteRowProps = {
    updateStatus: UpdateStatus;
};

const SuiteRow = ({ updateStatus }: SuiteRowProps) => {
    const theme = useTheme();

    const { desktopUpdate } = useSelector(state => state);

    const suiteCurrentVersion = process.env.VERSION || '';
    const suiteNewVersion = desktopUpdate.latest?.version;

    return (
        <UpdateRow
            leftItem={
                <SuiteIconRectangle>
                    <Icon name="trezor" size={iconSizes.medium} color={theme.iconDefaultInverted} />
                </SuiteIconRectangle>
            }
            updateStatus={updateStatus}
            header={<Translation id="TR_QUICK_ACTION_TOOLTIP_TREZOR_SUITE" />}
        >
            <Translation
                id={mapUpdateStatusToTranslation[updateStatus]}
                values={{ currentVersion: suiteCurrentVersion, newVersion: suiteNewVersion }}
            />
        </UpdateRow>
    );
};

type UpdateTooltipProps = {
    updateStatusDevice: UpdateStatus;
    updateStatusSuite: UpdateStatus;
};

export const UpdateTooltip = ({ updateStatusDevice, updateStatusSuite }: UpdateTooltipProps) => {
    const isDesktopSuite = isDesktop();

    return (
        <Column gap={spacings.xs} alignItems="start">
            <DeviceRow updateStatus={updateStatusDevice} />
            {isDesktopSuite && <SuiteRow updateStatus={updateStatusSuite} />}
        </Column>
    );
};
