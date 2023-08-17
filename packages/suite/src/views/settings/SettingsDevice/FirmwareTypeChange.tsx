import styled from 'styled-components';

import {
    ActionButton,
    ActionColumn,
    SectionItem,
    TextColumn,
    Translation,
    TrezorLink,
} from 'src/components/suite';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import { Button } from '@trezor/components';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import {
    getFirmwareVersion,
    hasBitcoinOnlyFirmware,
    isBitcoinOnlyDevice,
} from '@trezor/device-utils';
import { HELP_FIRMWARE_TYPE } from '@trezor/urls';
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
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.FirmwareType);

    if (!device?.features) {
        return null;
    }

    const bitcoinOnlyDevice = isBitcoinOnlyDevice(device);
    const currentFwVersion = getFirmwareVersion(device);
    const currentFwType = getSuiteFirmwareTypeString(device.firmwareType);
    const actionButtonId = hasBitcoinOnlyFirmware(device)
        ? 'TR_SWITCH_TO_REGULAR'
        : 'TR_SWITCH_TO_BITCOIN_ONLY';

    const handleAction = () => dispatch(goto('firmware-type', { params: { cancelable: true } }));

    return (
        <SectionItem
            data-test="@settings/device/firmware-type"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
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
                                            <Button
                                                variant="tertiary"
                                                icon="EXTERNAL_LINK"
                                                iconAlignment="right"
                                            >
                                                <Translation id={currentFwType} />
                                            </Button>
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
                        variant="secondary"
                        onClick={handleAction}
                        data-test="@settings/device/switch-fw-type-button"
                        isDisabled={isDeviceLocked}
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
        </SectionItem>
    );
};
