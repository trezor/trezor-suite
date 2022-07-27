import React from 'react';
import styled from 'styled-components';

import { GITHUB_FW_COMMIT_URL } from '@trezor/urls';
import { Translation, TrezorLink } from '@suite-components';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { useDevice, useActions } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';
import { getFwType, getFwVersion, isDeviceBitcoinOnly } from '@suite-utils/device';
import { Button, Tooltip } from '@trezor/components';
import { useAnchor } from '@suite-hooks/useAnchor';
import { SettingsAnchor } from '@suite-constants/anchors';
import { ModalVariant } from '@suite-types';

const Version = styled.div`
    span {
        display: flex;
        align-items: center;

        > :last-child {
            margin-left: 6px;
        }
    }
`;

const VersionTooltip = styled(Tooltip)`
    display: inline-flex;
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

    const { revision } = device.features;
    const currentFwVersion = getFwVersion(device);
    const currentFwType = getFwType(device);
    const actionButtonId = isDeviceBitcoinOnly(device)
        ? 'TR_SWITCH_TO_UNIVERSAL'
        : 'TR_SWITCH_TO_BITCOIN';

    const handleAction = () => {
        goto('firmware-index', {
            params: { cancelable: true, variant: ModalVariant.SwitchFirmwareType },
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
                                id="TR_YOUR_CURRENT_FIRMWARE_TYPE"
                                values={{
                                    version: (
                                        <VersionTooltip content={revision} disabled={!revision}>
                                            <TrezorLink
                                                href={GITHUB_FW_COMMIT_URL + revision}
                                                variant="nostyle"
                                            >
                                                <Button
                                                    variant="tertiary"
                                                    icon={revision ? 'EXTERNAL_LINK' : undefined}
                                                    alignIcon="right"
                                                    disabled={!revision}
                                                >
                                                    {currentFwType}
                                                </Button>
                                            </TrezorLink>
                                        </VersionTooltip>
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
