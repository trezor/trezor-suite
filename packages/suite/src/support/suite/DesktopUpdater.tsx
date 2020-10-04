import React, { useCallback, useEffect, useState } from 'react';
import { FormattedDate } from 'react-intl';
import ReactMarkdown from 'react-markdown';
import styled from 'styled-components';

import { Button, Modal, H2, variables, colors, Link } from '@trezor/components';
import { Translation } from '@suite-components';
import { UpdateInfo, UpdateProgress } from '@suite-types/desktop';
import { useActions, useSelector } from '@suite-hooks';

import { getReleaseNotes, getReleaseUrl } from '@suite/services/github';

import * as file from '@suite-utils/file';
import * as desktopUpdateActions from '@suite-actions/desktopUpdateActions';

const GreenH2 = styled(H2)`
    text-align: left;
    color: ${colors.NEUE_TYPE_GREEN};
`;

// TODO: Style properly
const ChangelogWrapper = styled.pre`
    margin: 20px 0px;
    background: ${colors.NEUE_BG_GRAY};
    border-radius: 8px;
    max-height: 400px;
    overflow-y: auto;
    padding: 16px 20px;
    color: ${colors.NEUE_TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    text-align: left;
`;

const GithubWrapper = styled.div`
    display: flex;
    justify-content: space-between;
`;

const Divider = styled.div`
    width: 100%;
    height: 1px;
    margin: 30px 0px;
    background: ${colors.NEUE_STROKE_GREY};
`;

const Row = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const DownloadWrapper = styled(Row)`
    margin-top: 16px;
`;

const LeftCol = styled.div`
    display: flex;
    flex: 1 1 calc(100% - 40px);
`;
const RightCol = styled.div`
    display: flex;
    margin-left: 40px;
    max-width: 280px;
    flex: 1 1 100%;
`;

const DateWrapper = styled.span`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
`;

const DownloadProgress = styled.span`
    font-size: 20px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
`;

const ReceivedData = styled.span`
    color: ${colors.NEUE_TYPE_GREEN};
`;

const TotalData = styled.span`
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
`;
const Text = styled(H2)`
    color: ${colors.NEUE_TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const ModalHeadingWrapper = styled.div`
    display: flex;
    width: 100%;
    justify-content: space-between;
`;

const MinimizeButton = styled(Button)`
    align-self: center;
`;

const Description = styled.span`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
`;

type ReleaseState = {
    loading: boolean;
    version: string | undefined;
    notes: string | undefined;
};

const DesktopUpdater = () => {
    const {
        checking,
        available,
        notAvailable,
        downloading,
        ready,
        skip,
        setUpdateWindow,
    } = useActions({
        checking: desktopUpdateActions.checking,
        available: desktopUpdateActions.available,
        notAvailable: desktopUpdateActions.notAvailable,
        downloading: desktopUpdateActions.downloading,
        ready: desktopUpdateActions.ready,
        skip: desktopUpdateActions.skip,
        setUpdateWindow: desktopUpdateActions.setUpdateWindow,
    });
    const desktopUpdate = useSelector(state => state.desktopUpdate);
    const [releaseNotes, setReleaseNotes] = useState<ReleaseState>({
        loading: false,
        version: undefined,
        notes: undefined,
    });

    useEffect(() => {
        if (!window.desktopApi) {
            return;
        }

        window.desktopApi.on('update/checking', () => checking());
        window.desktopApi.on('update/available', (info: UpdateInfo) => available(info));
        window.desktopApi.on('update/not-available', (info: UpdateInfo) => notAvailable(info));
        window.desktopApi.on('update/downloaded', (info: UpdateInfo) => ready(info));
        window.desktopApi.on('update/downloading', (progress: UpdateProgress) => {
            console.log(progress);
            downloading(progress);
        });

        /* TODO: Implement error handling
        window.desktopApi.on('update/error', ({ data }) => {

        });
        */
    }, [checking, available, notAvailable, downloading, ready]);

    useEffect(() => {
        const fetchData = async () => {
            setReleaseNotes({
                ...releaseNotes,
                loading: true,
            });

            let notes;
            const version = desktopUpdate.latest?.version;

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

        console.log(desktopUpdate.latest, releaseNotes);
        if (desktopUpdate.latest?.version !== releaseNotes.version && !releaseNotes.loading) {
            fetchData();
        }
    }, [desktopUpdate.latest, releaseNotes]);

    const downloadUpdate = useCallback(() => window.desktopApi?.downloadUpdate(), []);
    const installRestart = useCallback(() => window.desktopApi?.installUpdate(), []);
    const toggleMaxMinWindow = useCallback(
        () => setUpdateWindow(desktopUpdate.window === 'maximized' ? 'minimized' : 'maximized'),
        [desktopUpdate.window, setUpdateWindow],
    );
    const hideWindow = useCallback(() => setUpdateWindow('hidden'), [setUpdateWindow]);

    // TEMP
    console.log('desktopUpdate', desktopUpdate);
    //

    if (desktopUpdate.window === 'hidden') {
        return null;
    }

    // If the state is not set or set to checking or not-available, then show nothing
    if (!desktopUpdate.state || ['checking', 'not-available'].includes(desktopUpdate.state)) {
        return null;
    }

    // If the latest version is skipped, there's nothing to show
    if (!desktopUpdate.latest || desktopUpdate.skip === desktopUpdate.latest.version) {
        return null;
    }

    //
    // TODO: Single modal with multiple states or one modal per state?
    //

    if (desktopUpdate.state === 'available') {
        return (
            <Modal
                heading={<Translation id="TR_UPDATE_MODAL_AVAILABLE_HEADING" />}
                cancelable
                onCancel={hideWindow}
            >
                <GreenH2>
                    <Translation
                        id="TR_VERSION_HAS_BEEN_RELEASED"
                        values={{ version: desktopUpdate.latest.version }}
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
                    <Link variant="nostyle" href={getReleaseUrl(desktopUpdate.latest.version)}>
                        <Button variant="tertiary" icon="GITHUB">
                            <Translation id="TR_CHANGELOG_ON_GITHUB" />
                        </Button>
                    </Link>
                    <DateWrapper>
                        <FormattedDate value={desktopUpdate.latest.releaseDate} />
                    </DateWrapper>
                </GithubWrapper>

                <Divider />

                <Row>
                    <LeftCol>
                        <Button onClick={skip} variant="secondary" fullWidth>
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
    }

    if (desktopUpdate.state === 'downloading') {
        return (
            <Modal
                heading={
                    <ModalHeadingWrapper>
                        <Translation id="TR_UPDATE_MODAL_DOWNLOADING_UPDATE" />
                        <MinimizeButton
                            onClick={toggleMaxMinWindow}
                            variant="tertiary"
                            icon="ARROW_DOWN"
                        >
                            <Translation id="TR_MINIMIZE" />
                        </MinimizeButton>
                    </ModalHeadingWrapper>
                }
                currentProgressBarStep={desktopUpdate.progress?.percent || 0}
                totalProgressBarSteps={100}
                cancelable
                onCancel={hideWindow}
            >
                <DownloadWrapper>
                    <Text>
                        <Translation id="TR_DOWNLOADING" />
                    </Text>
                    <DownloadProgress>
                        <ReceivedData>
                            {file.toHumanReadable(desktopUpdate.progress?.transferred || 0)}
                        </ReceivedData>
                        /
                        <TotalData>
                            {file.toHumanReadable(desktopUpdate.progress?.total || 0)}
                        </TotalData>
                    </DownloadProgress>
                </DownloadWrapper>
            </Modal>
        );
    }

    if (desktopUpdate.state === 'ready') {
        return (
            <Modal
                heading={
                    <ModalHeadingWrapper>
                        <Translation id="TR_UPDATE_MODAL_UPDATE_DOWNLOADED" />
                        <MinimizeButton
                            onClick={toggleMaxMinWindow}
                            variant="tertiary"
                            icon="ARROW_DOWN"
                        >
                            <Translation id="TR_MINIMIZE" />
                        </MinimizeButton>
                    </ModalHeadingWrapper>
                }
                cancelable
                onCancel={hideWindow}
            >
                <H2>
                    <Translation id="TR_UPDATE_MODAL_INSTALL_NOW_OR_LATER" />
                </H2>
                <Description>
                    <Translation id="TR_UPDATE_MODAL_RESTART_NEEDED" />
                </Description>

                {/* TODO: consider moving action buttons to Modal's bottomBar prop. Divider could be also rendered by Modal itself */}
                <Divider />

                <Row>
                    <LeftCol>
                        <Button onClick={hideWindow} variant="secondary" fullWidth>
                            <Translation id="TR_UPDATE_MODAL_INSTALL_LATER" />
                        </Button>
                    </LeftCol>
                    <RightCol>
                        <Button onClick={installRestart} variant="primary" fullWidth>
                            <Translation id="TR_UPDATE_MODAL_INSTALL_AND_RESTART" />
                        </Button>
                    </RightCol>
                </Row>
            </Modal>
        );
    }

    return null;
};

export default DesktopUpdater;
