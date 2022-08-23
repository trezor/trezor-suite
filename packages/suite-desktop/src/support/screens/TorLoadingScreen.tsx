import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

import { desktopApi, BootstrapTorEvent } from '@trezor/suite-desktop-api';
import { Button, Progress, Image, variables, Modal } from '@trezor/components';
import { ThemeProvider } from '@suite-support/ThemeProvider';
import { TorStatus } from '@suite-types';
import { Translation } from '@suite-components/Translation';

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

const StyledImage = styled(Image)`
    margin-bottom: 28px;
`;

const Text = styled.h2`
    font-size: ${variables.FONT_SIZE.H2};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
`;

const InfoWrapper = styled.div`
    display: flex;
    justify-content: space-between;
`;

const MessageWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-bottom: 28px;
`;

const DisableButton = styled(Button)`
    margin-left: 10px;
    border: 1px solid ${({ theme }) => theme.STROKE_GREY};
    background: ${({ theme }) => theme.BG_WHITE};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};

    :hover {
        background: ${({ theme }) => theme.BG_LIGHT_RED};
    }
`;

const Percentage = styled.span`
    display: flex;
    align-items: center;
    font-variant-numeric: tabular-nums;
    height: 24px;
`;

const StyledProgress = styled(Progress)`
    display: flex;
    margin: 0 20px;
    border-radius: 5px;
    flex: 1;

    ${Progress.Value} {
        position: relative;
        border-radius: 5px;
    }
`;

const ProgressWrapper = styled.div`
    display: flex;
    align-items: center;
    border-radius: 8px;
    width: 100%;
    min-height: 45px;
`;

const ProgressMessage = styled.div`
    margin-right: 16px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
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

    let message: 'TR_ENABLING_TOR' | 'TR_ENABLING_TOR_FAILED' | 'TR_DISABLING_TOR' =
        'TR_ENABLING_TOR';
    if (torStatus === TorStatus.Error) {
        message = 'TR_ENABLING_TOR_FAILED';
    } else if (torStatus === TorStatus.Disabling) {
        message = 'TR_DISABLING_TOR';
    }

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

        // This is a total fake progress, otherwise it would be to fast for user.
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
            <Wrapper>
                <StyledModal
                    bottomBar={
                        torStatus === TorStatus.Error && (
                            <StyledButton icon="REFRESH" onClick={tryAgain}>
                                <Translation id="TR_TRY_AGAIN" />
                            </StyledButton>
                        )
                    }
                >
                    <MessageWrapper>
                        <StyledImage width={130} height={130} image="TOR_ENABLING" />
                        <Text>
                            <Translation id={message} />
                        </Text>
                    </MessageWrapper>

                    <InfoWrapper>
                        <ProgressWrapper>
                            <StyledProgress
                                isRed={torStatus === TorStatus.Error}
                                value={torStatus === TorStatus.Error ? 100 : progress}
                            />

                            <ProgressMessage>
                                {torStatus === TorStatus.Error ? (
                                    <Translation id="TR_FAILED" />
                                ) : (
                                    <Percentage>{progress} %</Percentage>
                                )}
                            </ProgressMessage>
                        </ProgressWrapper>

                        {torStatus !== TorStatus.Disabling && (
                            <DisableButton variant="secondary" onClick={disableTor}>
                                <Translation id="TR_TOR_DISABLE" />
                            </DisableButton>
                        )}
                    </InfoWrapper>
                </StyledModal>
            </Wrapper>
        </ThemeProvider>
    );
};
