import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

import { desktopApi, BootstrapTorEvent } from '@trezor/suite-desktop-api';
import { Button } from '@trezor/components';
import { TorStatus } from '@suite-types';
import { TorLoader, Modal, Translation } from '@suite-components';

import type { UserContextPayload } from '@suite-actions/modalActions';

const SmallModal = styled(Modal)`
    width: 560px;
`;

type RequestEnableTorProps = Omit<
    Extract<UserContextPayload, { type: 'request-enable-tor' }>,
    'type'
> & {
    onCancel: () => void;
};

export const TorLoading = ({ onCancel, decision }: RequestEnableTorProps) => {
    const [torStatus, setTorStatus] = useState<TorStatus>(TorStatus.Enabling);
    const [progress, setProgress] = useState<number>(0);

    useEffect(() => {
        desktopApi.on('tor/bootstrap', (bootstrapEvent: BootstrapTorEvent) => {
            if (bootstrapEvent.type === 'error') {
                setTorStatus(TorStatus.Error);
            }

            if (bootstrapEvent.type !== 'progress') {
                return;
            }

            if (bootstrapEvent.type === 'progress' && bootstrapEvent.progress.current) {
                setProgress(bootstrapEvent.progress.current);

                if (bootstrapEvent.progress.current === bootstrapEvent.progress.total) {
                    setTorStatus(TorStatus.Enabled);
                    decision.resolve('enable');
                } else {
                    setTorStatus(TorStatus.Enabling);
                }
            }
        });

        return () => desktopApi.removeAllListeners('tor/bootstrap');
    }, [torStatus, decision]);

    const tryAgain = async () => {
        setProgress(0);
        setTorStatus(TorStatus.Enabling);

        const torLoaded = await desktopApi.toggleTor(true);

        if (!torLoaded.success) {
            setTorStatus(TorStatus.Error);
        }
    };

    const disableTor = async () => {
        let fakeProgress = 0;

        setTorStatus(TorStatus.Disabling);

        desktopApi.removeAllListeners('tor/bootstrap');
        desktopApi.toggleTor(false);

        // This is a total fake progress, otherwise it would be too fast for user.
        await new Promise(resolve => {
            const interval = setInterval(() => {
                if (fakeProgress === 100) {
                    clearInterval(interval);
                    return resolve(null);
                }

                fakeProgress += 10;
                setProgress(fakeProgress);
            }, 300);
        });

        decision.resolve('cancel');
        onCancel();
    };

    return (
        <>
            <SmallModal
                heading={<Translation id="TR_TOR_ENABLE" />}
                bottomBar={
                    torStatus === TorStatus.Error && (
                        <Button icon="REFRESH" onClick={tryAgain}>
                            <Translation id="TR_TRY_AGAIN" />
                        </Button>
                    )
                }
            >
                <TorLoader torStatus={torStatus} progress={progress} disableTor={disableTor} />
            </SmallModal>
        </>
    );
};
