import styled, { useTheme } from 'styled-components';
import { useDevice, useSelector } from '../../../../../../../hooks/suite';
import { Column, getIconSize, Icon, IconSize, iconSizes } from '@trezor/components';
import {
    mapUpdateStatusToIcon,
    mapUpdateStatusToVariant,
    UpdateStatus,
} from './updateQuickActionTypes';
import { Translation } from '../../../../../Translation';
import { spacings } from '@trezor/theme';
import { TranslationKey } from '@suite-common/intl-types';
import { getFirmwareVersion } from '@trezor/device-utils';
import { isDesktop } from '@trezor/env-utils';
import { mapTrezorModelToIcon } from '@trezor/product-components';
import { TooltipRow } from '../TooltipRow';

const SuiteIconRectangle = styled.div<{ $size: IconSize }>`
    display: flex;
    align-items: center;
    justify-content: center;
    padding-left: 0.5px;
    width: ${({ $size }) => getIconSize($size)}px;
    height: ${({ $size }) => getIconSize($size)}px;

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
        <TooltipRow
            leftItem={
                <Icon
                    name={mapTrezorModelToIcon[device.features.internal_model]}
                    size={iconSizes.medium}
                />
            }
            circleIconName={mapUpdateStatusToIcon[updateStatus]}
            variant={mapUpdateStatusToVariant[updateStatus]}
            header={<Translation id="TR_QUICK_ACTION_TOOLTIP_TREZOR_DEVICE" />}
        >
            <Translation
                id={mapUpdateStatusToTranslation[updateStatus]}
                values={{
                    currentVersion: firmwareCurrentVersion,
                    newVersion: firmwareNewVersion,
                }}
            />
        </TooltipRow>
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
        <TooltipRow
            leftItem={
                <SuiteIconRectangle $size="medium">
                    <Icon name="trezor" size={iconSizes.small} color={theme.iconDefaultInverted} />
                </SuiteIconRectangle>
            }
            circleIconName={mapUpdateStatusToIcon[updateStatus]}
            variant={mapUpdateStatusToVariant[updateStatus]}
            header={<Translation id="TR_QUICK_ACTION_TOOLTIP_TREZOR_SUITE" />}
        >
            <Translation
                id={mapUpdateStatusToTranslation[updateStatus]}
                values={{ currentVersion: suiteCurrentVersion, newVersion: suiteNewVersion }}
            />
        </TooltipRow>
    );
};

type UpdateTooltipProps = {
    updateStatusDevice: UpdateStatus;
    updateStatusSuite: UpdateStatus;
};

export const UpdateTooltip = ({ updateStatusDevice, updateStatusSuite }: UpdateTooltipProps) => {
    const isDesktopSuite = isDesktop();

    return (
        <Column gap={spacings.md} alignItems="start">
            <DeviceRow updateStatus={updateStatusDevice} />
            {isDesktopSuite && <SuiteRow updateStatus={updateStatusSuite} />}
        </Column>
    );
};
