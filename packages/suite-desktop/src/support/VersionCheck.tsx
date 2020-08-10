import React, { useState, useEffect } from 'react';
import ReactMarkdown, { Renderers } from 'react-markdown';
import styled from 'styled-components';
import { Loading, Translation } from '@suite-components';
import { Modal, Button, Link, colors } from '@trezor/components';
import { isDev } from '@suite-utils/build';
import { CHANGELOG_MARKDOWN_URL, CHANGELOG_MARKDOWN_URL_DEV } from '@suite-constants/urls';

interface Props {
    children: JSX.Element;
}

interface State {
    outdated: boolean;
    sha?: string;
}

const Content = styled.div`
    display: flex;
    color: ${colors.NEUE_TYPE_DARK_GREY};
    flex-direction: column;
`;

const DescriptionWrapper = styled.span`
    color: ${colors.NEUE_TYPE_DARK_GREY};
    line-height: 1.5;
`;

const Version = styled.span`
    font-family: Consolas, Menlo, Courier, monospace;
`;

const Span = styled.span`
    font-family: Consolas, Menlo, Courier, monospace;
    padding: 2px 4px;
    background-color: ${colors.NEUE_BG_GRAY};
    border-radius: 4px;
`;

const ChangesSummary = styled.div`
    background-color: ${colors.NEUE_BG_GRAY};
    border: 1px solid ${colors.NEUE_STROKE_GREY};
    border-radius: 4px;
    font-size: 12px;
    padding: 20px;
    margin: 20px;
    /* max-width: 600px; */
    max-height: 400px;
    overflow-y: auto;
    text-align: left;

    /* Hides Changelog, The format is based on keepachangelog.com... */
    h1,
    p:first-of-type {
        display: none;
    }

    h2 {
        margin-top: 6px;
        margin-bottom: 6px;
    }

    h2:not(:first-of-type) {
        margin-top: 20px;
        padding-top: 10px;
        border-top: 1px solid #e8e8e8;
    }

    h3 {
        margin-bottom: 4px;
    }

    ul {
        margin-bottom: 10px;
        list-style-type: none;
        margin-left: 4px;
    }
`;

const Actions = styled.div`
    display: flex;
    width: 100%;
    padding: 0px 20px;
    flex-direction: column;
    button + button {
        margin-top: 12px;
    }
`;

const linkReferenceRenderer: Renderers[string] = reference => {
    if (!reference.href) {
        return <>[{reference.children}]</>;
    }
    return <a href={reference.$ref}>{reference.children}</a>;
};

// Component above Preloader
// Keep app from trigger SUITE.INIT before version comparison
const VersionCheck = ({ children }: Props) => {
    const [state, setState] = useState<State | null>(null);
    const [changelog, setChangelog] = useState<string | undefined>(undefined);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        const abortController = new AbortController();
        // TODO:
        // - fetch commits from "release" branch (link)
        // - download page link
        // - fetch once per 24h, keep the timestamp in the storage
        // - lower timeout, this fetch should be quick, not noticeable
        const fetchCommits = async () => {
            try {
                const response = await fetch(
                    'https://api.github.com/repos/trezor/trezor-suite/commits?per_page=1&sha=releases',
                    { signal: abortController.signal },
                );
                if (!response.ok) {
                    throw Error(
                        `Error while fetching info about latest version: ${response.status}`,
                    );
                }
                const body = await response.json();
                const { sha } = body[0];
                const outdated = sha !== process.env.COMMITHASH;
                setState({
                    outdated,
                    sha,
                });
            } catch (error) {
                // fetch failed
                console.error(error);
                setState({ outdated: false });
            }
        };

        const fetchChangelog = async () => {
            const isStaging = process.env.ENV === 'staging';
            try {
                const response = await fetch(
                    isStaging ? CHANGELOG_MARKDOWN_URL_DEV : CHANGELOG_MARKDOWN_URL,
                    {
                        signal: abortController.signal,
                    },
                );
                if (!response.ok) {
                    throw Error(`Error while fetching changelog: ${response.status}`);
                }
                const changelog = await response.text();
                setChangelog(changelog);
            } catch (error) {
                // fetch failed
                console.error(error);
            }
        };

        if (!isDev()) {
            fetchCommits();
            fetchChangelog();
        } else {
            setState({ outdated: false });
        }

        return () => {
            abortController.abort();
        };
    }, []);

    // wait for fetch
    if (!state) return <Loading />;

    // display warning message
    if (state.outdated && !checked) {
        return (
            <Modal
                size="large"
                heading={<Translation id="DESKTOP_OUTDATED_TITLE" />}
                description={
                    <DescriptionWrapper>
                        <Translation
                            id="DESKTOP_OUTDATED_MESSAGE"
                            values={{
                                currentVersion: (
                                    <>
                                        <Span>{process.env.COMMITHASH}</Span>(
                                        <Version>{process.env.VERSION}</Version>)
                                    </>
                                ),
                                newVersion: <Span>{state.sha}</Span>,
                            }}
                        />
                    </DescriptionWrapper>
                }
                bottomBar={
                    <Actions>
                        <Button icon="EXTERNAL_LINK" alignIcon="right">
                            <Link
                                variant="nostyle"
                                href="https://beta-wallet.trezor.io/wallet/start"
                            >
                                <Translation id="DESKTOP_OUTDATED_BUTTON_DOWNLOAD" />
                            </Link>
                        </Button>

                        <Button onClick={() => setChecked(true)} variant="secondary">
                            <Translation id="DESKTOP_OUTDATED_BUTTON_CANCEL" />
                        </Button>
                    </Actions>
                }
            >
                <Content>
                    <ChangesSummary>
                        {changelog ? (
                            <ReactMarkdown
                                source={changelog}
                                renderers={{ linkReference: linkReferenceRenderer }}
                            />
                        ) : (
                            <Translation id="TR_COULD_NOT_RETRIEVE_CHANGELOG" />
                        )}
                    </ChangesSummary>
                </Content>
            </Modal>
        );
    }

    // return Preloader
    return children;
};

export default VersionCheck;
