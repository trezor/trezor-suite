import React from 'react';
import styled from 'styled-components';

import { Button, Progress, Image, variables } from '@trezor/components';
import { TorStatus } from '@suite-types';
import { Translation } from '@suite-components/Translation';

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

interface TorLoaderProps {
    torStatus: TorStatus;
    progress: number;
    disableTor: () => void;
}

export const TorLoader = ({ torStatus, progress, disableTor }: TorLoaderProps) => {
    let message: 'TR_ENABLING_TOR' | 'TR_ENABLING_TOR_FAILED' | 'TR_DISABLING_TOR' =
        'TR_ENABLING_TOR';
    if (torStatus === TorStatus.Error) {
        message = 'TR_ENABLING_TOR_FAILED';
    } else if (torStatus === TorStatus.Disabling) {
        message = 'TR_DISABLING_TOR';
    }

    return (
        <>
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
                    <DisableButton
                        data-test="@tor-loading-screen/disable-button"
                        variant="secondary"
                        onClick={disableTor}
                    >
                        <Translation id="TR_TOR_DISABLE" />
                    </DisableButton>
                )}
            </InfoWrapper>
        </>
    );
};
