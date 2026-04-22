import { useSelector } from 'react-redux';

import { Translation, type TranslationKey } from '@suite/intl';
import { selectSelectedDevice } from '@suite-common/device';
import { Column, Icon } from '@trezor/components';
import { getFirmwareVersion } from '@trezor/device-utils';
import { isDesktop } from '@trezor/env-utils';
import { TooltipRow, mapTrezorModelToIcon } from '@trezor/product-components';

import { type DesktopUpdateRootState } from '../desktopUpdateReducer';
import {
    type UpdateStatus,
    type UpdateStatusDevice,
    type UpdateStatusSuite,
    mapUpdateStatusToIcon,
    mapUpdateStatusToIntent,
} from './updateQuickActionTypes';

const mapUpdateStatusToTranslation: Record<UpdateStatus, TranslationKey> = {
    disconnected: 'TR_QUICK_ACTION_TOOLTIP_DEVICE_DISCONNECTED',
    'update-downloaded-manual': 'TR_QUICK_ACTION_TOOLTIP_UPDATE_AVAILABLE',
    'update-downloaded-auto-restart-to-update': 'TR_QUICK_ACTION_TOOLTIP_RESTART_TO_UPDATE',
    'up-to-date': 'TR_QUICK_ACTION_TOOLTIP_UP_TO_DATE',
    'update-available': 'TR_QUICK_ACTION_TOOLTIP_UPDATE_AVAILABLE',
    'just-updated': 'TR_QUICK_ACTION_TOOLTIP_JUST_UPDATED',
};

type DeviceRowProps = {
    updateStatus: UpdateStatusDevice;
    onClick?: () => void;
};

const DeviceRow = ({ updateStatus, onClick }: DeviceRowProps) => {
    const device = useSelector(selectSelectedDevice);

    if (device?.features === undefined) {
        return null;
    }

    const firmwareCurrentVersion = getFirmwareVersion(device);
    const firmwareNewVersion = device.firmwareReleaseConfigInfo?.release?.version?.join('.');

    return (
        <TooltipRow
            onClick={onClick}
            leftItem={
                <Icon name={mapTrezorModelToIcon[device.features.internal_model]} size={16} />
            }
            iconName={mapUpdateStatusToIcon[updateStatus]}
            intent={mapUpdateStatusToIntent[updateStatus]}
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
    updateStatus: UpdateStatusSuite;
    onClick?: () => void;
};

const SuiteRow = ({ updateStatus, onClick }: SuiteRowProps) => {
    const suiteNewVersion = useSelector(
        // eslint-disable-next-line no-restricted-syntax
        (state: DesktopUpdateRootState) => state.desktopUpdate.latest?.version,
    );
    const suiteCurrentVersion = process.env.VERSION || '';

    return (
        <TooltipRow
            onClick={onClick}
            leftItem={<Icon name="trezorLogo" size={16} />}
            iconName={mapUpdateStatusToIcon[updateStatus]}
            intent={mapUpdateStatusToIntent[updateStatus]}
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
    displayDeviceUpdateStatus: boolean;
    updateStatusDevice: UpdateStatusDevice;
    onClickDevice?: () => void;
    updateStatusSuite: UpdateStatusSuite;
    onClickSuite?: () => void;
};

export const UpdateTooltip = ({
    displayDeviceUpdateStatus,
    updateStatusDevice,
    onClickDevice,
    updateStatusSuite,
    onClickSuite,
}: UpdateTooltipProps) => {
    const isDesktopSuite = isDesktop();

    return (
        <Column gap={16} padding={4} alignItems="start">
            {displayDeviceUpdateStatus && (
                <DeviceRow updateStatus={updateStatusDevice} onClick={onClickDevice} />
            )}
            {isDesktopSuite && <SuiteRow updateStatus={updateStatusSuite} onClick={onClickSuite} />}
        </Column>
    );
};
