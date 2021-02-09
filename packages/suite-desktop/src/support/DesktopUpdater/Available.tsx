import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';

import { Button, H2, variables, Link } from '@trezor/components';
import { Translation, Modal, FormattedDate } from '@suite-components';
import { Row, LeftCol, RightCol, Divider } from './styles';

import { getReleaseNotes, getReleaseUrl } from '@suite/services/github';
import { UpdateInfo } from '@suite-types/desktop';

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
        list-style-type: none;
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
    });

    useEffect(() => {
        const fetchData = async () => {
            setReleaseNotes({
                ...releaseNotes,
                loading: true,
            });

            let notes;
            const version = latest?.version;

            try {
                if (!version) {
                    throw new Error("Couldn't get latest version.");
                }

                const release = await getReleaseNotes(version);
                notes = release.body;
            } finally {
                setReleaseNotes({
                    loading: false,
                    version,
                    notes,
                });
            }
        };

        if (latest?.version !== releaseNotes.version && !releaseNotes.loading) {
            fetchData();
        }
    }, [latest, releaseNotes]);

    const downloadUpdate = useCallback(() => window.desktopApi!.downloadUpdate(), []);
    const skipUpdate = useCallback(() => {
        window.desktopApi!.skipUpdate(latest!.version);
    }, [latest]);

    return (
        <Modal
            heading={<Translation id="TR_UPDATE_MODAL_AVAILABLE_HEADING" />}
            cancelable
            onCancel={hideWindow}
        >
            <GreenH2>
                <Translation
                    id="TR_VERSION_HAS_BEEN_RELEASED"
                    values={{ version: latest?.version }}
                />
            </GreenH2>

            <ChangelogWrapper>
                {releaseNotes.notes ? (
                    <ReactMarkdown source={releaseNotes.notes} />
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
                    <Button onClick={skipUpdate} variant="secondary" fullWidth>
                        <Translation id="TR_UPDATE_MODAL_SKIP_THIS_VERSION" />
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
