import React, { useState, useEffect } from 'react';
import styled, { css } from 'styled-components';

import { desktopApi, BootstrapTorEvent } from '@trezor/suite-desktop-api';
import { P, Button, Progress, variables } from '@trezor/components';
import { Image } from '@suite-components';
import { ThemeProvider } from '@suite-support/ThemeProvider';
import { TorStatus } from '@suite-types';

const Wrapper = styled.div`
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
`;

const Text = styled(P)`
    height: 0;
    font-size: ${variables.FONT_SIZE.H2};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

const ModalWindow = styled.div`
    display: flex;
    flex-direction: column;
    position: relative;
    border-radius: 16px;
    text-align: center;
    transition: all 0.3s;
    max-width: 95%;
    min-width: 305px;
    width: 720px;
    padding: 42px;

    ${({ theme }) =>
        css`
            background: ${theme.BG_WHITE};
            box-shadow: 0 10px 80px 0 ${theme.BOX_SHADOW_MODAL};
        `}
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
    padding-bottom: 50px;
`;

const Separator = styled.hr`
    height: 1px;
    width: 100%;
    background: none;
    border: 0;
    border-top: 1px solid ${props => props.theme.STROKE_GREY};
    margin: 20px;
`;

const TryAgainWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const DisableButton = styled(Button)`
    padding-right: 30px;
    padding-left: 30px;
    border: 1px solid #f4f4f4;
    margin-left: 10px;
`;

const Percentage = styled.div`
    display: flex;
    font-variant-numeric: tabular-nums;
    height: 24px;
`;

const StyledProgress = styled(Progress)`
    display: flex;
    margin-right: 20px;
    margin-left: 20px;
    border-radius: 5px;
    background: ${({ theme }) => theme.STROKE_GREY_ALT};
    flex: 1;

    ${Progress.Value} {
        height: 3px;
        position: relative;
        border-radius: 5px;
    }
`;

const ProgressWrapper = styled.div`
    display: flex;
    align-items: center;
    background: ${({ theme }) => theme.STROKE_GREY_ALT};
    border-radius: 8px;
    width: 100%;
    min-height: 45px;
`;

const ProgressMessage = styled.div`
    margin-left: 10px;
    margin-right: 10px;
    color: ${props => props.theme.TYPE_DARK_GREY};
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
            if (bootstrapEvent.type !== 'progress') return;
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

    let message = 'Enabling Tor';
    if (torStatus === TorStatus.Error) {
        message = 'Enabling Tor Failed';
    } else if (torStatus === TorStatus.Disabling) {
        message = 'Disabling Tor';
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
                <ModalWindow>
                    <MessageWrapper>
                        <Image width={130} height={130} image="TOR_ENABLING" />
                        <Text>{message}</Text>
                    </MessageWrapper>

                    <InfoWrapper>
                        <ProgressWrapper>
                            <StyledProgress
                                isRed={torStatus === TorStatus.Error}
                                value={torStatus === TorStatus.Error ? 100 : progress}
                            />
                            <ProgressMessage>
                                {torStatus === TorStatus.Error ? (
                                    <P>Failed</P>
                                ) : (
                                    <Percentage>{progress} %</Percentage>
                                )}
                            </ProgressMessage>
                        </ProgressWrapper>
                        {torStatus !== TorStatus.Disabling && (
                            <DisableButton
                                variant="secondary"
                                isWhite
                                onClick={e => {
                                    e.stopPropagation();
                                    disableTor();
                                }}
                            >
                                Disable Tor
                            </DisableButton>
                        )}
                    </InfoWrapper>

                    {torStatus === TorStatus.Error && (
                        <TryAgainWrapper>
                            <Separator />
                            <Button
                                onClick={e => {
                                    e.stopPropagation();
                                    tryAgain();
                                }}
                            >
                                Try Again
                            </Button>
                        </TryAgainWrapper>
                    )}
                </ModalWindow>
            </Wrapper>
        </ThemeProvider>
    );
};
