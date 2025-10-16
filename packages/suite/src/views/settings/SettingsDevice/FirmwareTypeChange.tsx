import styled from 'styled-components';

import { firmwareActions } from '@suite-common/firmware';
import { NewButton } from '@trezor/components';
import {
    getFirmwareVersion,
    hasBitcoinOnlyFirmware,
    isBitcoinOnlyDevice,
} from '@trezor/device-utils';
import { HELP_FIRMWARE_TYPE } from '@trezor/urls';

import { goto } from 'src/actions/suite/routerActions';
import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { ActionButton, ActionColumn, TextColumn, TrezorLink } from 'src/components/suite';
import { Translation } from 'src/components/suite/Translation';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { getSuiteFirmwareTypeString } from 'src/utils/firmware';

const Version = styled.div`
    span {
        display: flex;
        align-items: center;

        > :last-child {
            margin-left: 6px;
        }
    }
`;

interface FirmwareTypeProps {
    isDeviceLocked: boolean;
}

export const FirmwareTypeChange = ({ isDeviceLocked }: FirmwareTypeProps) => {
    const dispatch = useDispatch();
    const { device } = useDevice();

    if (!device?.features) {
        return null;
    }

    const bitcoinOnlyDevice = isBitcoinOnlyDevice(device);
    const currentFwVersion = getFirmwareVersion(device);
    const currentFwType = getSuiteFirmwareTypeString(device.firmwareType);
    const actionButtonId = hasBitcoinOnlyFirmware(device)
        ? 'TR_SWITCH_TO_REGULAR'
        : 'TR_SWITCH_TO_BITCOIN_ONLY';

    const handleAction = () => {
        dispatch(goto('firmware-type', { params: { cancelable: true } }));
        dispatch(firmwareActions.setSwitchFirmwareType(true));
    };

    return (
        <SettingsSectionItem anchorId={SettingsAnchor.FirmwareType}>
            <TextColumn
                title={<Translation id="TR_FIRMWARE_TYPE" />}
                description={
                    currentFwVersion && currentFwType ? (
                        <Version>
                            <Translation
                                id="TR_YOUR_FIRMWARE_TYPE"
                                values={{
                                    version: (
                                        <TrezorLink href={HELP_FIRMWARE_TYPE} variant="nostyle">
                                            <NewButton
                                                intent="neutral"
                                                priority="secondary"
                                                size="small"
                                                iconRight="arrowUpRight"
                                            >
                                                <Translation id={currentFwType} />
                                            </NewButton>
                                        </TrezorLink>
                                    ),
                                }}
                            />
                        </Version>
                    ) : (
                        <Translation id="TR_YOUR_CURRENT_FIRMWARE_UNKNOWN" />
                    )
                }
            />
            {!bitcoinOnlyDevice && (
                <ActionColumn>
                    <ActionButton
                        intent="brand"
                        onClick={handleAction}
                        data-testid="@settings/device/switch-fw-type-button"
                        isDisabled={isDeviceLocked}
                        isTooltipActive={isDeviceLocked}
                        tooltipContent={
                            <Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />
                        }
                    >
                        <Translation
                            id={actionButtonId}
                            values={{
                                bitcoinOnly: <Translation id="TR_FIRMWARE_TYPE_BITCOIN_ONLY" />,
                                regular: <Translation id="TR_FIRMWARE_TYPE_REGULAR" />,
                            }}
                        />
                    </ActionButton>
                </ActionColumn>
            )}
        </SettingsSectionItem>
    );
};
