import React from 'react';
import styled from 'styled-components';

import { Icon, Button, Link, colors, variables } from '@trezor/components';
import { CHANGELOG_URL } from '@suite-constants/urls';
import { Translation, ExternalLink } from '@suite-components';
import { getFwVersion } from '@suite-utils/device';
import { useDevice, useFirmware } from '@suite-hooks';
import { ReconnectInNormalStep, NoNewFirmware, ContinueButton, P, H2 } from '@firmware-components';

const { FONT_SIZE, FONT_WEIGHT } = variables;

const HeadingWrapper = styled.div``;

const Heading = () => {
    const { device } = useDevice();
    if (device?.mode === 'normal') {
        return (
            <HeadingWrapper>
                <Translation id="TR_UPDATE_AVAILABLE" />
                <Version>
                    <Translation
                        id="TR_DEVICE_FIRMWARE_VERSION"
                        values={{ firmware: getFwVersion(device) }}
                    />
                </Version>
            </HeadingWrapper>
        );
    }
    return <Translation id="TR_FIRMWARE_UPDATE" />;
};

const BodyWrapper = styled.div`
    text-align: left;
`;

const ChangesSummary = styled.div`
    width: 100%;
    text-align: left;
    background-color: ${colors.BLACK98};
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
`;

const ChangelogGroup = styled.div`
    margin-bottom: 20px;
    color: ${colors.NEUE_TYPE_DARK_GREY};
    font-size: ${FONT_SIZE.SMALL};
`;

const ChangelogHeading = styled.div`
    font-weight: ${FONT_WEIGHT.MEDIUM};
`;

const Version = styled.span`
    display: block;
    font-size: ${FONT_SIZE.SMALL};
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
`;

const ChangesUl = styled.ul`
    margin-left: 16px;

    & > li {
        margin: 4px 0;
    }
`;

const StyledExternalLink = styled(ExternalLink)`
    margin: 4px 0;
`;

const BottomRow = styled.div`
    margin-top: 8px;
`;

const Body = () => {
    const { device } = useDevice();

    // ensure that device is connected in requested mode
    if (device?.mode !== 'normal') return <ReconnectInNormalStep.Body />;
    if (device?.firmware === 'valid') return <NoNewFirmware.Body />;

    const { firmwareRelease } = device;
    if (!device?.features || !firmwareRelease) return null; // ts

    // Create custom object containing changelogs for easier manipulation in render() method.
    // Default changelog format is just a long string where individual changes are separated by "*" symbol.
    const logsCustomObject: any = {};

    if (firmwareRelease.changelog && firmwareRelease.changelog?.length > 0) {
        firmwareRelease.changelog.forEach((log: any) => {
            // get array of individual changes for a given version
            const logsArr = log.changelog.trim().split(/\*/g);

            // The first element of logsArr is an empty array, so get rid of it (but still make sure it's really empty).
            if (!logsArr[0]) {
                logsArr.shift();
            }

            // Get firmware version, convert to string and use it as a key in custom object
            const versionString = log.version.join('.'); // e.g. [1,9,8] => "1.9.8"

            logsCustomObject[versionString] = {}; // Object initialization
            logsCustomObject[versionString].changelogs = logsArr;
            logsCustomObject[versionString].url = log.url;
            logsCustomObject[versionString].notes = log.notes;
        });
    }

    return (
        <BodyWrapper>
            <H2 isGreen>v{firmwareRelease.release.version.join('.')} has been released!</H2>
            <P>
                <Translation id="FIRMWARE_UPDATE_AVAILABLE_DESC" />
            </P>

            {Object.keys(logsCustomObject).length > 0 && (
                <ChangesSummary>
                    {Object.keys(logsCustomObject).map(version => {
                        const log = logsCustomObject[version];
                        return (
                            <ChangelogGroup key={version}>
                                <ChangelogHeading>{version}</ChangelogHeading>
                                <ChangesUl>
                                    {/* render individual changes for a given version */}
                                    {log.changelogs.map(
                                        (change: string) =>
                                            // return only if change is not an empty array
                                            change && <li key={change}>{change}</li>,
                                    )}
                                </ChangesUl>
                                {log.notes && (
                                    <StyledExternalLink size="small" href={log.notes}>
                                        <Translation id="TR_LEARN_MORE" />
                                    </StyledExternalLink>
                                )}
                            </ChangelogGroup>
                        );
                    })}
                </ChangesSummary>
            )}

            <BottomRow>
                <Button variant="tertiary" icon="GITHUB">
                    <Link href={CHANGELOG_URL}>
                        <Translation id="TR_READ_ALL_ON_GITHUB" />
                    </Link>
                </Button>
            </BottomRow>
        </BodyWrapper>
    );
};

const HowLong = styled.div`
    color: ${colors.NEUE_TYPE_DARK_GREY};
    font-size: ${FONT_SIZE.TINY};
    display: flex;
    justify-content: center;
    margin-top: 16px;
`;

const BottomBar = () => {
    const { setStatus } = useFirmware();
    const { device } = useDevice();

    if (!device?.connected || !device?.features || device.mode !== 'normal') {
        return null;
    }

    if (['outdated', 'required'].includes(device.firmware)) {
        return (
            <>
                <ContinueButton onClick={() => setStatus('check-seed')} />
                <HowLong>
                    <Icon size={12} icon="CLOCK" />
                    <Translation id="TR_TAKES_N_MINUTES" values={{ n: '5' }} />
                </HowLong>
            </>
        );
    }

    return null;
};

export const InitialStep = {
    Heading,
    Body,
    BottomBar,
};
