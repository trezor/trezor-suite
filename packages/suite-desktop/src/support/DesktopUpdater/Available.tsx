import React, { useCallback } from 'react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';

import { desktopApi, UpdateInfo } from '@trezor/suite-desktop-api';
import { Button, H2, variables, Link } from '@trezor/components';
import { Translation, Modal, FormattedDate } from '@suite-components';
import { useActions } from '@suite-hooks';
import { getReleaseUrl } from '@suite/services/github';
import * as desktopUpdateActions from '@suite-actions/desktopUpdateActions';

const GreenH2 = styled(H2)`
    text-align: left;
    color: ${props => props.theme.TYPE_GREEN};
`;

const ChangelogWrapper = styled.div`
    margin: 20px 0px;
    background: ${props => props.theme.BG_GREY};
    border-radius: 8px;
    max-height: 400px;
    overflow-y: auto;
    padding: 16px 20px;
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    text-align: left;

    h3 {
        margin-bottom: 4px;
        font-size: ${variables.FONT_SIZE.NORMAL};
        font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    }

    ul,
    ol {
        margin-bottom: 10px;
        margin-left: 36px; /* hacky way to add enough indentation so it is rendered right of an emoji in a section heading */
    }

    li + li {
        margin-top: 4px;
    }

    li {
        line-height: 1.57;
    }

    /* 
    Styling similar to  Link component. 
    It seems overriding via linkReference renderer doesn't work for some reason
    */
    a {
        cursor: pointer;
        text-decoration: underline;
        color: inherit;
        &:visited,
        &:active,
        &:hover {
            text-decoration: underline;
            color: inherit;
        }
    }
`;

const GithubWrapper = styled.div`
    display: flex;
    justify-content: space-between;
`;

const DateWrapper = styled.span`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const StyledModal = styled(Modal)`
    ${Modal.BottomBar} {
        > * {
            flex: 1;
        }
    }
`;

interface VersionNameProps {
    latestVersion?: string;
    prerelease: boolean;
}

const getVersionName = ({ latestVersion, prerelease }: VersionNameProps): string => {
    if (!latestVersion) {
        // fallback for undefined version
        return '';
    }
    if (!prerelease) {
        // regular case
        return latestVersion;
    }
    if (!latestVersion.includes('-')) {
        // add beta label for pre-releases, but prevent versions like '21.10.1-alpha-beta'
        return `${latestVersion}-beta`;
    }
    // fallback for pre-release versions already including some pre-release components
    return latestVersion;
};

interface AvailableProps {
    hideWindow: () => void;
    latest?: UpdateInfo;
}

const Available = ({ hideWindow, latest }: AvailableProps) => {
    const { download } = useActions({
        download: desktopUpdateActions.download,
    });

    const downloadUpdate = useCallback(() => {
        download();
        desktopApi.downloadUpdate();
    }, [download]);

    return (
        <StyledModal
            heading={<Translation id="TR_UPDATE_MODAL_AVAILABLE_HEADING" />}
            cancelable
            onCancel={hideWindow}
            bottomBar={
                <>
                    <Button onClick={hideWindow} variant="secondary">
                        <Translation id="TR_UPDATE_MODAL_NOT_NOW" />
                    </Button>
                    <Button onClick={downloadUpdate} variant="primary">
                        <Translation id="TR_UPDATE_MODAL_START_DOWNLOAD" />
                    </Button>
                </>
            }
        >
            <GreenH2>
                <Translation
                    id="TR_VERSION_HAS_BEEN_RELEASED"
                    values={{
                        version: getVersionName({
                            latestVersion: latest?.version,
                            prerelease: !!latest?.prerelease,
                        }),
                    }}
                />
            </GreenH2>

            <ChangelogWrapper>
                {latest?.changelog ? (
                    <ReactMarkdown>{latest?.changelog}</ReactMarkdown>
                ) : (
                    <Translation id="TR_COULD_NOT_RETRIEVE_CHANGELOG" />
                )}
            </ChangelogWrapper>

            <GithubWrapper>
                <Link variant="nostyle" href={getReleaseUrl(latest?.version ?? '')}>
                    <Button variant="tertiary" icon="GITHUB">
                        <Translation id="TR_CHANGELOG_ON_GITHUB" />
                    </Button>
                </Link>
                <DateWrapper>
                    <FormattedDate value={latest?.releaseDate} date />
                </DateWrapper>
            </GithubWrapper>
        </StyledModal>
    );
};

export default Available;
