import React from 'react';
import styled from 'styled-components';
import { Button, Icon, Tooltip, variables } from '@trezor/components';
import { Translation, TrezorLink } from '@suite-components';
import {
    getFwUpdateVersion,
    getFwVersion,
    isBitcoinOnly,
    parseFirmwareChangelog,
} from '@suite-utils/device';
import { AcquiredDevice } from '@suite-types';
import { CHANGELOG_URL } from '@suite-constants/urls';

const FwVersionWrapper = styled.div`
    display: flex;
    width: 100%;
    justify-content: center;
    align-items: center;
    padding: 16px 0px;
    /* border-bottom: 1px solid ${props => props.theme.STROKE_GREY}; */
`;

const FwVersion = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`;

const VersionWrapper = styled.div`
    display: flex;
    align-items: center;
    margin-top: 6px;

    .tippy-tooltip {
        background: ${props => props.theme.BG_WHITE};
    }
`;

const Version = styled.span<{ new?: boolean }>`
    color: ${props => (props.new ? props.theme.TYPE_GREEN : props.theme.TYPE_LIGHT_GREY)};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-variant-numeric: tabular-nums;
    margin-right: 6px;
`;

const Label = styled(Version)`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.TINY};
`;

const IconWrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0px 80px;
`;

const Changelog = styled.div`
    color: ${props => props.theme.TYPE_DARK_GREY};
    max-height: 360px;
    min-width: 305px;
    overflow: auto;
`;

const ChangelogGroup = styled.div`
    margin-bottom: 20px;
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const ChangelogHeading = styled.div`
    display: flex;
    justify-content: space-between;
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    margin-bottom: 24px;
`;

const ChangesUl = styled.ul`
    margin-left: 16px;

    & > li {
        margin: 4px 0;
    }
`;

interface Props {
    device: AcquiredDevice;
    customFirmware?: boolean;
}

const FirmwareOffer = ({ device, customFirmware }: Props) => {
    const currentVersion = device.firmware !== 'none' ? getFwVersion(device) : undefined;

    const newVersion = customFirmware ? (
        <Translation id="TR_CUSTOM_FIRMWARE_VERSION" />
    ) : (
        getFwUpdateVersion(device)
    );

    const parsedChangelog =
        !customFirmware && parseFirmwareChangelog(device.features, device.firmwareRelease);

    const bitcoinOnlyVersion = isBitcoinOnly(device) && ' (bitcoin-only)';

    return (
        <FwVersionWrapper>
            {currentVersion && (
                <>
                    <FwVersion>
                        <Label>
                            <Translation id="TR_ONBOARDING_CURRENT_VERSION" />
                        </Label>
                        <VersionWrapper>
                            <Version>
                                {currentVersion}
                                {bitcoinOnlyVersion}
                            </Version>
                        </VersionWrapper>
                    </FwVersion>
                    <IconWrapper>
                        <Icon icon="ARROW_RIGHT_LONG" size={16} />
                    </IconWrapper>
                </>
            )}
            <FwVersion>
                <Label>
                    <Translation id="TR_ONBOARDING_NEW_VERSION" />
                </Label>
                <VersionWrapper>
                    {parsedChangelog ? (
                        <Tooltip
                            rich
                            dashed
                            content={
                                <Changelog>
                                    <ChangelogGroup key={parsedChangelog.versionString}>
                                        <ChangelogHeading>
                                            <Translation
                                                id="TR_VERSION"
                                                values={{ version: parsedChangelog.versionString }}
                                            />
                                            <TrezorLink
                                                size="small"
                                                variant="nostyle"
                                                href={
                                                    parsedChangelog.notes
                                                        ? parsedChangelog.notes
                                                        : CHANGELOG_URL
                                                }
                                            >
                                                <Button
                                                    variant="tertiary"
                                                    icon="EXTERNAL_LINK"
                                                    alignIcon="right"
                                                >
                                                    View all
                                                </Button>
                                            </TrezorLink>
                                        </ChangelogHeading>
                                        <ChangesUl>
                                            {/* render individual changes for a given version */}
                                            {parsedChangelog.changelog.map(
                                                change =>
                                                    // return only if change is not an empty array
                                                    change && <li key={change}>{change}</li>,
                                            )}
                                        </ChangesUl>
                                    </ChangelogGroup>
                                </Changelog>
                            }
                            placement="top"
                        >
                            <Version new data-test="@firmware/offer-version/new">
                                {newVersion}
                                {bitcoinOnlyVersion}
                            </Version>
                        </Tooltip>
                    ) : (
                        <Version new>
                            {newVersion}
                            {!customFirmware && bitcoinOnlyVersion}
                        </Version>
                    )}
                </VersionWrapper>
            </FwVersion>
        </FwVersionWrapper>
    );
};

export { FirmwareOffer };
