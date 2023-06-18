import React from 'react';
import styled from 'styled-components';

import { Translation, TrezorLink } from 'src/components/suite';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from 'src/components/suite/Settings';
import { useDevice, useActions } from 'src/hooks/suite';
import * as routerActions from 'src/actions/suite/routerActions';
import { Button } from '@trezor/components';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { getFirmwareType, getFirmwareVersion } from '@trezor/device-utils';
import { HELP_FIRMWARE_TYPE } from '@trezor/urls';

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
    const { device } = useDevice();
    const { goto } = useActions({
        goto: routerActions.goto,
    });

    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.FirmwareType);

    if (!device?.features) {
        return null;
    }

    const currentFwVersion = getFirmwareVersion(device);
    const currentFwType = getFirmwareType(device);
    const actionButtonId =
        device.firmwareType === 'bitcoin-only' ? 'TR_SWITCH_TO_UNIVERSAL' : 'TR_SWITCH_TO_BITCOIN';

    const handleAction = () => {
        goto('firmware-type', {
            params: { cancelable: true },
        });
    };

    return (
        <SectionItem
            data-test="@settings/device/firmware-type"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
            <TextColumn
                title={<Translation id="TR_FIRMWARE_TYPE" />}
                description={
                    currentFwVersion ? (
                        <Version>
                            <Translation
                                id="TR_YOUR_FIRMWARE_TYPE"
                                values={{
                                    version: (
                                        <TrezorLink href={HELP_FIRMWARE_TYPE} variant="nostyle">
                                            <Button
                                                variant="tertiary"
                                                icon="EXTERNAL_LINK"
                                                alignIcon="right"
                                            >
                                                {currentFwType}
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
            <ActionColumn>
                <ActionButton
                    variant="secondary"
                    onClick={handleAction}
                    data-test="@settings/device/switch-fw-type-button"
                    isDisabled={isDeviceLocked}
                >
                    <Translation id={actionButtonId} />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
