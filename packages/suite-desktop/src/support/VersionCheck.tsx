import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Loading, Translation } from '@suite-components';
import { Modal, Button, Link, colors } from '@trezor/components';
import { isDev } from '@suite-utils/build';

interface Props {
    children: JSX.Element;
}

interface State {
    outdated: boolean;
    sha?: string;
    message?: string;
}

const Content = styled.div`
    display: flex;
    flex-direction: column;
`;

const Span = styled.span`
    background-color: ${colors.BLACK96};
    padding: 0px 4px;
`;

const ChangesSummary = styled.div`
    background-color: ${colors.BLACK96};
    border: 1px solid ${colors.BLACK80};
    border-radius: 4px;
    font-size: 12px;
    padding: 20px;
    margin: 20px;
    max-width: 600px;
    max-height: 300px;
    overflow-y: auto;
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

// Component above Preloader
// Keep app from trigger SUITE.INIT before version comparison
export default ({ children }: Props) => {
    const [state, setState] = useState<State | null>(null);
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
                const body = await response.json();
                const { sha, commit } = body[0];
                const outdated = sha !== process.env.COMMITHASH;
                setState({
                    outdated,
                    sha,
                    message: commit.message,
                });
            } catch (error) {
                // fetch failed, do nothing
                setState({ outdated: false });
            }
        };

        if (!isDev()) {
            fetchCommits();
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
                size="small"
                heading={<Translation id="DESKTOP_OUTDATED_TITLE" />}
                description={
                    <Translation
                        id="DESKTOP_OUTDATED_MESSAGE"
                        values={{
                            currentVersion: <Span>{process.env.COMMITHASH}</Span>,
                            newVersion: <Span>{state.sha}</Span>,
                        }}
                    />
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
                    <ChangesSummary>{state.message}</ChangesSummary>
                </Content>
            </Modal>
        );
    }

    // return Preloader
    return children;
};
