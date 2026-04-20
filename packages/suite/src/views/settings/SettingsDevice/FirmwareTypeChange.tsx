import { getSuiteFirmwareTypeString } from '@suite/firmware';
import { Translation } from '@suite/intl';
import { Anchor, SettingsAnchor, goto } from '@suite/router';
import { firmwareActions } from '@suite-common/firmware';
import { Button } from '@trezor/components';
import {
    getFirmwareVersion,
    hasBitcoinOnlyFirmware,
    isBitcoinOnlyDevice,
} from '@trezor/device-utils';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';
import { HELP_FIRMWARE_TYPE } from '@trezor/urls';

import { useDevice, useDispatch } from 'src/hooks/suite';

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
        dispatch(goto({ routeName: 'firmware-type', params: { cancelable: true } }));
        dispatch(firmwareActions.setSwitchFirmwareType(true));
    };

    return (
        <Anchor anchorId={SettingsAnchor.FirmwareType}>
            {({ anchorId, anchorRef, shouldHighlight }) => (
                <SectionItem
                    data-testid={anchorId}
                    ref={anchorRef}
                    shouldHighlight={shouldHighlight}
                >
                    <TextColumn
                        title={<Translation id="TR_FIRMWARE_TYPE" />}
                        description={
                            currentFwVersion && currentFwType ? (
                                <Translation
                                    id="TR_YOUR_FIRMWARE_TYPE"
                                    values={{
                                        version: (
                                            <Button
                                                intent="neutral"
                                                priority="secondary"
                                                size="small"
                                                href={HELP_FIRMWARE_TYPE}
                                                margin={{ left: 4 }}
                                            >
                                                <Translation id={currentFwType} />
                                            </Button>
                                        ),
                                    }}
                                />
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
                                        bitcoinOnly: (
                                            <Translation id="TR_FIRMWARE_TYPE_BITCOIN_ONLY" />
                                        ),
                                        regular: <Translation id="TR_FIRMWARE_TYPE_REGULAR" />,
                                    }}
                                />
                            </ActionButton>
                        </ActionColumn>
                    )}
                </SectionItem>
            )}
        </Anchor>
    );
};
