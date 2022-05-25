import React from 'react';
import styled from 'styled-components';
import { GITHUB_FW_COMMIT_URL } from '@trezor/urls';

import { Translation, TrezorLink } from '@suite-components';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { useDevice, useActions } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';
import { getFwVersion, isBitcoinOnly, getFwUpdateVersion } from '@suite-utils/device';
import { Button, Tooltip } from '@trezor/components';
import { AcquiredDevice } from '@suite-types';
import { useAnchor } from '@suite-hooks/useAnchor';
import { SettingsAnchor } from '@suite-constants/anchors';

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

const getButtonLabelId = ({
    availableFwVersion,
    currentFwVersion,
    device,
}: {
    availableFwVersion: string | null;
    currentFwVersion: string | null;
    device: AcquiredDevice;
}) => {
    if (currentFwVersion && availableFwVersion && currentFwVersion === availableFwVersion) {
        return 'TR_UP_TO_DATE';
    }
    switch (device.firmware) {
        case 'valid':
            return 'TR_UP_TO_DATE';
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
    const { device } = useDevice();
    const { goto } = useActions({
        goto: routerActions.goto,
    });
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.FirmwareVersion);

    if (!device?.features) {
        return null;
    }

    const currentFwVersion = getFwVersion(device);
    const availableFwVersion = getFwUpdateVersion(device);
    const { revision } = device.features;

    return (
        <SectionItem
            data-test="@settings/device/firmware-version"
            ref={anchorRef}
            shouldHighlight={shouldHighlight}
        >
            <TextColumn
                title={<Translation id="TR_FIRMWARE_VERSION" />}
                description={
                    currentFwVersion ? (
                        <Version>
                            <Translation
                                id="TR_YOUR_CURRENT_FIRMWARE"
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
                                                    {currentFwVersion}
                                                    {isBitcoinOnly(device) && ' (bitcoin-only)'}
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
                    onClick={() => goto('firmware-index', { params: { cancelable: true } })}
                    data-test="@settings/device/update-button"
                    isDisabled={isDeviceLocked}
                >
                    <Translation
                        id={getButtonLabelId({ device, currentFwVersion, availableFwVersion })}
                    />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
