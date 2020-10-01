import React, { useCallback, useEffect } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Dispatch, AppState } from '@suite-types';
import { Button, Modal } from '@trezor/components';
import { ProgressBar } from '@suite-components';
import { UpdateInfo, UpdateProgress } from '@suite-types/desktop';

import * as file from '@suite-utils/file';
import * as desktopUpdateActions from '@suite-actions/desktopUpdateActions';

const mapStateToProps = (state: AppState) => ({
    desktopUpdate: state.desktopUpdate,
});

const mapDispatchToProps = (dispatch: Dispatch) =>
    bindActionCreators(
        {
            checking: desktopUpdateActions.checking,
            available: desktopUpdateActions.available,
            notAvailable: desktopUpdateActions.notAvailable,
            downloading: desktopUpdateActions.downloading,
            ready: desktopUpdateActions.ready,
            skip: desktopUpdateActions.skip,
            setUpdateWindow: desktopUpdateActions.setUpdateWindow,
        },
        dispatch,
    );

type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const DesktopUpdater = (props: Props) => {
    const {
        checking,
        available,
        notAvailable,
        downloading,
        ready,
        skip,
        desktopUpdate,
        setUpdateWindow,
    } = props;

    useEffect(() => {
        window.desktopApi.on('update/checking', () => checking());
        window.desktopApi.on('update/available', (info: UpdateInfo) => available(info));
        window.desktopApi.on('update/not-available', (info: UpdateInfo) => notAvailable(info));
        window.desktopApi.on('update/downloaded', (info: UpdateInfo) => ready(info));
        window.desktopApi.on('update/downloading', (progress: UpdateProgress) =>
            downloading(progress),
        );

        /* TODO: Implement error handling
        window.desktopApi.on('update/error', ({ data }) => {

        });
        */
    }, [checking, available, notAvailable, downloading, ready]);

    const downloadUpdate = useCallback(() => window.desktopApi.downloadUpdate(), []);
    const installRestart = useCallback(() => window.desktopApi.installUpdate(), []);
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
            <Modal heading="Update available!">
                <p>
                    A new version {desktopUpdate.latest.version} has been relased on
                    {desktopUpdate.latest.releaseDate}!
                </p>
                <p>Do you wish to install it?</p>
                <Button onClick={skip}>Skip this version</Button>
                <Button onClick={downloadUpdate}>Start download</Button>
            </Modal>
        );
    }

    if (desktopUpdate.state === 'downloading') {
        return (
            <Modal heading="Downloading update...">
                <ProgressBar total={100} current={desktopUpdate.progress?.percent || 0} />
                <p>
                    {file.toHumanReadable(desktopUpdate.progress?.transferred || 0)}/
                    {file.toHumanReadable(desktopUpdate.progress?.total || 0)}
                    &nbsp;-&nbsp;
                    {file.toHumanReadable(desktopUpdate.progress?.bytesPerSecond || 0)} per second.
                </p>
                <Button onClick={toggleMaxMinWindow}>Minimize</Button>
            </Modal>
        );
    }

    if (desktopUpdate.state === 'ready') {
        return (
            <Modal heading="Update ready!">
                <p>
                    You can now install the latest update. Would you like to install it now and
                    restart or next time you close the application?
                </p>
                <Button onClick={installRestart}>Install and Restart</Button>
                <Button onClick={hideWindow}>Later (next restart)</Button>
            </Modal>
        );
    }

    return null;
};

export default connect(mapStateToProps, mapDispatchToProps)(DesktopUpdater);
