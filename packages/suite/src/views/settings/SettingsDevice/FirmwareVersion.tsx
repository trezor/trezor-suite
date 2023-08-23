import styled from 'styled-components';

import { getChangelogUrl, getFwUpdateVersion } from '@suite-common/suite-utils';
import { getFirmwareVersion } from '@trezor/device-utils';
import { Button, Tooltip } from '@trezor/components';

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
import { AcquiredDevice } from 'src/types/suite';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { SettingsAnchor } from 'src/constants/suite/anchors';

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
    const dispatch = useDispatch();
    const { device } = useDevice();
    const { anchorRef, shouldHighlight } = useAnchor(SettingsAnchor.FirmwareVersion);

    if (!device?.features) {
        return null;
    }

    const currentFwVersion = getFirmwareVersion(device);
    const availableFwVersion = getFwUpdateVersion(device);
    const { revision } = device.features;
    const changelogUrl = getChangelogUrl(device, revision);
    const githubButtonIcon = revision ? 'EXTERNAL_LINK' : undefined;

    const handleUpdate = () => dispatch(goto('firmware-index', { params: { cancelable: true } }));

    const GithubButton = () => (
        <Button
            variant="tertiary"
            icon={githubButtonIcon}
            iconAlignment="right"
            isDisabled={!revision}
        >
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
