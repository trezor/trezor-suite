import styled from 'styled-components';

import { Button, ProgressBar, Icon, variables } from '@trezor/components';

import { Translation } from 'src/components/suite';
import { borders } from '@trezor/theme';

const IconWrapper = styled.div`
    width: 120px;
    height: 120px;
    border-radius: 50%;
    margin-bottom: 28px;
    background: ${({ theme }) => theme.BG_GREY};
    display: flex;
    align-items: center;
    justify-content: center;
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

const MessageSlowWrapper = styled(MessageWrapper)`
    flex-direction: row;
    margin-top: 28px;
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

const StyledProgressBar = styled(ProgressBar)`
    display: flex;
    margin: 0 20px;
    border-radius: 5px;
    flex: 1;

    ${ProgressBar.Value} {
        position: relative;
        border-radius: 5px;
    }
`;

const ProgressWrapper = styled.div`
    display: flex;
    align-items: center;
    background: ${({ theme }) => theme.BG_GREY};
    border-radius: ${borders.radii.xs};
    width: 100%;
    min-height: 45px;
`;

const ProgressMessage = styled.div`
    margin-right: 16px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

interface TorProgressBarProps {
    isTorError: boolean;
    isTorDisabling: boolean;
    isTorBootstrapSlow: boolean;
    progress: number;
    disableTor: () => void;
}

export const TorProgressBar = ({
    isTorError,
    isTorDisabling,
    isTorBootstrapSlow,
    progress,
    disableTor,
}: TorProgressBarProps) => {
    let message: 'TR_ENABLING_TOR' | 'TR_ENABLING_TOR_FAILED' | 'TR_DISABLING_TOR' =
        'TR_ENABLING_TOR';
    if (isTorError) {
        message = 'TR_ENABLING_TOR_FAILED';
    } else if (isTorDisabling) {
        message = 'TR_DISABLING_TOR';
    }

    return (
        <>
            <MessageWrapper>
                <IconWrapper>
                    <Icon icon="TOR" size={80} />
                </IconWrapper>
                <Text>
                    <Translation id={message} />
                </Text>
            </MessageWrapper>

            <InfoWrapper>
                <ProgressWrapper>
                    <StyledProgressBar isRed={isTorError} value={isTorError ? 100 : progress} />

                    <ProgressMessage>
                        {isTorError ? (
                            <Translation id="TR_FAILED" />
                        ) : (
                            <Percentage>{progress} %</Percentage>
                        )}
                    </ProgressMessage>
                </ProgressWrapper>

                {!isTorDisabling && (
                    <DisableButton
                        data-test="@tor-loading-screen/disable-button"
                        variant="secondary"
                        onClick={disableTor}
                    >
                        <Translation id="TR_TOR_DISABLE" />
                    </DisableButton>
                )}
            </InfoWrapper>

            {isTorBootstrapSlow && (
                <MessageSlowWrapper>
                    <Translation id="TR_TOR_IS_SLOW_MESSAGE" values={{ br: () => ' ' }} />
                </MessageSlowWrapper>
            )}
        </>
    );
};
