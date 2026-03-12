import { Translation, useTranslation } from '@suite/intl';
import { SettingsAnchor , goto } from '@suite/router';
import { getChangelogUrl } from '@suite-common/suite-utils';
import { Button, Tooltip } from '@trezor/components';
import { getFirmwareVersion } from '@trezor/device-utils';

import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { ActionButton, ActionColumn, TextColumn } from 'src/components/suite';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { AcquiredDevice } from 'src/types/suite';

const getButtonLabelId = ({ device }: { device: AcquiredDevice }) => {
    if (!device.firmwareReleaseConfigInfo?.isNewer) {
        return 'TR_REINSTALL';
    }
    switch (device.firmware) {
        case 'valid':
            return 'TR_REINSTALL';
        case 'required':
        case 'outdated':
            return 'TR_UPDATE_AVAILABLE';
        default:
            // FW unknown or none
            return 'TR_INSTALL_LATEST_FW';
    }
};

interface FirmwareVersionProps {
    isDeviceLocked: boolean;
}

export const FirmwareVersion = ({ isDeviceLocked }: FirmwareVersionProps) => {
    const dispatch = useDispatch();
    const { device } = useDevice();
    const { translationString } = useTranslation();

    if (!device?.features) {
        return null;
    }

    const currentFwVersion = getFirmwareVersion(device);
    const { revision } = device.features;
    const changelogUrl = getChangelogUrl(device, revision);

    const handleUpdate = () => {
        dispatch(goto({ routeName: 'firmware-index', params: { cancelable: true } }));
    };

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.FirmwareVersion}>
            <TextColumn
                title={<Translation id="TR_FIRMWARE_VERSION" />}
                description={
                    currentFwVersion ? (
                        <Translation
                            id="TR_YOUR_FIRMWARE_VERSION"
                            values={{
                                version: (
                                    <Tooltip content={revision} display="inline-flex">
                                        <Button
                                            intent="neutral"
                                            priority="secondary"
                                            size="small"
                                            isDisabled={!revision}
                                            href={revision ? changelogUrl : undefined}
                                            margin={{ left: 4 }}
                                        >
                                            {device.firmware === 'valid'
                                                ? `${currentFwVersion} (${translationString('TR_UP_TO_DATE').toLowerCase()})`
                                                : currentFwVersion}
                                        </Button>
                                    </Tooltip>
                                ),
                            }}
                        />
                    ) : (
                        <Translation id="TR_YOUR_CURRENT_FIRMWARE_UNKNOWN" />
                    )
                }
            />
            <ActionColumn>
                <ActionButton
                    intent="brand"
                    onClick={handleUpdate}
                    data-testid="@settings/device/update-button"
                    isDisabled={isDeviceLocked}
                    isTooltipActive={isDeviceLocked}
                    tooltipContent={<Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />}
                >
                    <Translation id={getButtonLabelId({ device })} />
                </ActionButton>
            </ActionColumn>
        </SettingsSectionItem>
    );
};
