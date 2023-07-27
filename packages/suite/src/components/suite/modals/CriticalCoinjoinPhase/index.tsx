import React from 'react';
import styled from 'styled-components';
import { variables, Image } from '@trezor/components';
import { Modal, Translation } from 'src/components/suite';
import { useSelector, useDevice } from 'src/hooks/suite';
import { selectCoinjoinAccountByKey } from 'src/reducers/wallet/coinjoinReducer';
import { PhaseProgress } from './PhaseProgress';
import { ROUND_PHASE_MESSAGES } from 'src/constants/suite/coinjoin';
import { useCoinjoinSessionPhase } from 'src/hooks/wallet';
import { AutoStopButton } from './AutoStopButton';

const StyledModal = styled(Modal)`
    width: 520px;
`;

const Content = styled.div`
    display: flex;
    align-items: center;
    text-align: start;
    gap: 36px;
    padding: 22px 22px 32px 32px;
    border-bottom: 1px solid ${({ theme }) => theme.STROKE_LIGHT_GREY};
`;

const TextContainer = styled.div`
    max-width: 280px;
`;

const CoinjoinText = styled.h3`
    margin-bottom: 10px;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    text-transform: uppercase;
`;

const DisconnectWarning = styled.p`
    font-size: 32px;
    line-height: 32px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.TYPE_DARK_ORANGE};
`;

const Phase = styled.p`
    margin-top: 16px;
    color: ${({ theme }) => theme.TYPE_LIGHTER_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

interface CriticalCoinjoinPhaseProps {
    relatedAccountKey: string;
}

export const CriticalCoinjoinPhase = ({ relatedAccountKey }: CriticalCoinjoinPhaseProps) => {
    const { device } = useDevice();
    const relatedCoinjoinAccount = useSelector(state =>
        selectCoinjoinAccountByKey(state, relatedAccountKey),
    );

    const session = relatedCoinjoinAccount?.session;
    const roundPhase = session?.roundPhase;
    const sessionPhase = useCoinjoinSessionPhase(relatedAccountKey);
    const deviceModelInternal = device?.features?.internal_model;

    if (!roundPhase || !sessionPhase) {
        return null;
    }

    return (
        <StyledModal>
            <Content>
                {deviceModelInternal && (
                    <Image image={`DONT_DISCONNECT_TREZOR_${deviceModelInternal}`} />
                )}

                <TextContainer>
                    <CoinjoinText>
                        <Translation id="TR_COINJOIN_RUNNING" />
                    </CoinjoinText>
                    <DisconnectWarning>
                        <Translation id="TR_DO_NOT_DISCONNECT_DEVICE" />
                    </DisconnectWarning>
                    <Phase>
                        <Translation id={ROUND_PHASE_MESSAGES[roundPhase]} />
                    </Phase>
                </TextContainer>
            </Content>

            <PhaseProgress
                roundPhase={roundPhase}
                phaseDeadline={session?.roundPhaseDeadline}
                sessionPhase={sessionPhase}
            />

            <AutoStopButton relatedAccountKey={relatedAccountKey} />
        </StyledModal>
    );
};
