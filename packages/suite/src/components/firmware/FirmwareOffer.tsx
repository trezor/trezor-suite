import React from 'react';
import styled from 'styled-components';
import { Button, Icon, Tooltip, variables } from '@trezor/components';
import { Translation, TrezorLink } from '@suite-components';
import { parseFirmwareChangelog } from '@suite-utils/device';
import { useTheme } from '@suite-hooks';
import { TrezorDevice } from '@suite-types';
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
    /* color: ${props => props.theme.TYPE_DARK_GREY}; */
    max-height: 360px;
    padding: 12px 16px 0px 24px;
    overflow: auto;
`;

const ChangelogGroup = styled.div`
    margin-bottom: 20px;
    /* color: ${props => props.theme.TYPE_DARK_GREY}; */
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
    currentVersion?: string;
    newVersion: string | null;
    releaseChangelog: TrezorDevice['firmwareRelease'];
}

const FirmwareOffer = ({ currentVersion, newVersion, releaseChangelog }: Props) => {
    const parsedChangelog = parseFirmwareChangelog(releaseChangelog);
    console.log('releaseChangelog', releaseChangelog);
    console.log('parsedChangelog', parsedChangelog);
    const { theme } = useTheme();
    return (
        <FwVersionWrapper>
            {currentVersion && (
                <>
                    <FwVersion>
                        <Label>
                            <Translation id="TR_ONBOARDING_CURRENT_VERSION" />
                        </Label>
                        <Version>{currentVersion}</Version>
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
                    <Version new>{newVersion}</Version>
                    {parsedChangelog && (
                        <Tooltip
                            content={
                                <Changelog>
                                    {parsedChangelog.slice(0, 1).map(log => (
                                        <ChangelogGroup key={log.versionString}>
                                            <ChangelogHeading>
                                                <Translation
                                                    id="TR_VERSION"
                                                    values={{ version: log.versionString }}
                                                />
                                                <TrezorLink
                                                    size="small"
                                                    variant="nostyle"
                                                    href={CHANGELOG_URL}
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
                                                {log.changelog.map(
                                                    change =>
                                                        // return only if change is not an empty array
                                                        change && <li key={change}>{change}</li>,
                                                )}
                                            </ChangesUl>
                                        </ChangelogGroup>
                                    ))}
                                </Changelog>
                            }
                            placement="top"
                        >
                            <Icon
                                useCursorPointer
                                size={14}
                                color={theme.TYPE_GREEN}
                                icon="QUESTION_ACTIVE"
                            />
                        </Tooltip>
                    )}
                </VersionWrapper>
            </FwVersion>
        </FwVersionWrapper>
    );
};

export default FirmwareOffer;
export { FirmwareOffer };
