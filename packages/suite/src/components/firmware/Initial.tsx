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

const ChangelogPre = styled.pre`
    white-space: pre-wrap;
`;

const Version = styled.span`
    display: block;
    font-size: ${FONT_SIZE.SMALL};
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
`;

const BottomRow = styled.div`
    margin-top: auto;
`;

const Body = () => {
    const { device } = useDevice();

    // ensure that device is connected in requested mode
    if (device?.mode !== 'normal') return <ReconnectInNormalStep.Body />;
    if (device?.firmware === 'valid') return <NoNewFirmware.Body />;

    const { firmwareRelease } = device;
    if (!device?.features || !firmwareRelease) return null; // ts

    return (
        <BodyWrapper>
            <H2 isGreen>v{firmwareRelease.release.version.join('.')} has released!</H2>
            <P>
                <Translation id="FIRMWARE_UPDATE_AVAILABLE_DESC" />
            </P>

            {firmwareRelease.changelog && (
                <ChangesSummary>
                    {firmwareRelease.changelog.map(c => (
                        <ChangelogGroup key={c.url}>
                            <ChangelogHeading>{c.version.join('.')}</ChangelogHeading>
                            <ChangelogPre>{c.changelog.replace(/\*/g, '—')}</ChangelogPre>
                            {c.notes && (
                                <ExternalLink size="small" href={c.notes}>
                                    <Translation id="TR_LEARN_MORE" />
                                </ExternalLink>
                            )}
                        </ChangelogGroup>
                    ))}
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
