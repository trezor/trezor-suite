import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';

import { Button, H2, variables, Link } from '@trezor/components';
import { Translation, Modal, FormattedDate } from '@suite-components';
import { Row, LeftCol, RightCol, Divider } from './styles';
import { useActions } from '@suite-hooks';

import { getReleaseNotes, getReleaseUrl } from '@suite/services/github';
import type { UpdateInfo } from '@suite-types/desktop';
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

type ReleaseState = {
    loading: boolean;
    version?: string;
    notes?: string;
    prerelease: boolean;
};

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

interface Props {
    hideWindow: () => void;
    latest?: UpdateInfo;
}

const Available = ({ hideWindow, latest }: Props) => {
    const [releaseNotes, setReleaseNotes] = useState<ReleaseState>({
        loading: false,
        version: undefined,
        notes: undefined,
        prerelease: false,
    });

    const { download } = useActions({
        download: desktopUpdateActions.download,
    });

    useEffect(() => {
        const fetchData = async () => {
            setReleaseNotes({
                ...releaseNotes,
                loading: true,
            });

            let notes;
            let prerelease = false;
            const version = latest?.version;

            try {
                if (!version) {
                    throw new Error("Couldn't get latest version.");
                }

                const release = await getReleaseNotes(version);
                notes = release?.body;
                prerelease = !!release?.prerelease;
            } finally {
                setReleaseNotes({
                    loading: false,
                    version,
                    notes,
                    prerelease,
                });
            }
        };

        if (latest?.version !== releaseNotes.version && !releaseNotes.loading) {
            fetchData();
        }
    }, [latest, releaseNotes]);

    const downloadUpdate = useCallback(() => {
        download();
        window.desktopApi!.downloadUpdate();
    }, [download]);

    return (
        <Modal
            heading={<Translation id="TR_UPDATE_MODAL_AVAILABLE_HEADING" />}
            cancelable
            onCancel={hideWindow}
        >
            <GreenH2>
                <Translation
                    id="TR_VERSION_HAS_BEEN_RELEASED"
                    values={{
                        version: getVersionName({
                            latestVersion: latest?.version,
                            prerelease: !!releaseNotes?.prerelease,
                        }),
                    }}
                />
            </GreenH2>

            <ChangelogWrapper>
                {releaseNotes.notes ? (
                    <ReactMarkdown>{releaseNotes.notes}</ReactMarkdown>
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

            <Divider />

            <Row>
                <LeftCol>
                    <Button onClick={hideWindow} variant="secondary" fullWidth>
                        <Translation id="TR_UPDATE_MODAL_NOT_NOW" />
                    </Button>
                </LeftCol>
                <RightCol>
                    <Button onClick={downloadUpdate} variant="primary" fullWidth>
                        <Translation id="TR_UPDATE_MODAL_START_DOWNLOAD" />
                    </Button>
                </RightCol>
            </Row>
        </Modal>
    );
};

export default Available;
