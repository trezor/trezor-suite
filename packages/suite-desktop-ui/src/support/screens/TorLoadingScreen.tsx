import React, { useState, useEffect } from 'react';

import styled from 'styled-components';
import { ThemeProvider } from '@suite-support/ThemeProvider';
import { TorStatus } from '@suite-types';
import { Translation, TorLoader } from '@suite-components';

import { Button, Modal } from '@trezor/components';
import { desktopApi, BootstrapTorEvent } from '@trezor/suite-desktop-api';

const Wrapper = styled.div`
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
`;

const StyledModal = styled(Modal)`
    max-width: 600px;
`;

const StyledButton = styled(Button)`
    width: 150px;
`;

interface TorLoadingScreenProps {
    callback: (value?: unknown) => void;
}

export const TorLoadingScreen = ({ callback }: TorLoadingScreenProps) => {
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
                    callback();
                } else {
                    setTorStatus(TorStatus.Enabling);
                }
            }
        });

        return () => desktopApi.removeAllListeners('tor/bootstrap');
    }, [torStatus, callback]);

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

        callback();
    };

    return (
        <ThemeProvider>
            <Wrapper data-test="@tor-loading-screen">
                <StyledModal
                    bottomBar={
                        torStatus === TorStatus.Error && (
                            <StyledButton
                                data-test="@tor-loading-screen/try-again-button"
                                icon="REFRESH"
                                onClick={tryAgain}
                            >
                                <Translation id="TR_TRY_AGAIN" />
                            </StyledButton>
                        )
                    }
                >
                    <TorLoader torStatus={torStatus} progress={progress} disableTor={disableTor} />
                </StyledModal>
            </Wrapper>
        </ThemeProvider>
    );
};
