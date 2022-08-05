import React from 'react';
import styled from 'styled-components';

import { Translation, TrezorLink } from '@suite-components';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@suite-components/Settings';
import { useDevice, useActions } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';
import { getChangelogUrl, getFwVersion, getFwUpdateVersion } from '@suite-utils/device';
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
    const changelogUrl = getChangelogUrl(device, revision);
    const githubButtonIcon = revision ? 'EXTERNAL_LINK' : undefined;

    const handleUpdate = () => goto('firmware-index', { params: { cancelable: true } });

    const GithubButton = () => (
        <Button variant="tertiary" icon={githubButtonIcon} alignIcon="right" disabled={!revision}>
            {currentFwVersion}
        </Button>
    );

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
                                id="TR_YOUR_FIRMWARE_VERSION"
                                values={{
                                    version: (
                                        <VersionTooltip content={revision} disabled={!revision}>
                                            {revision ? (
                                                <TrezorLink href={changelogUrl} variant="nostyle">
                                                    <GithubButton />
                                                </TrezorLink>
                                            ) : (
                                                // remove the link if revision is unknown (in bootloader mode)
                                                <GithubButton />
                                            )}
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
                    onClick={handleUpdate}
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
