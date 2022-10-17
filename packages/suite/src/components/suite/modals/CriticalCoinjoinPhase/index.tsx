import React from 'react';
import styled from 'styled-components';
import { variables, Image } from '@trezor/components';
import { Modal, Translation } from '@suite-components';
import { useSelector } from '@suite-hooks/useSelector';
import { selectCoinjoinAccountByKey } from '@wallet-reducers/coinjoinReducer';
import { PhaseProgress } from './PhaseProgress';

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

const DisconnectText = styled.p`
    font-size: 32px;
    line-height: 32px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.TYPE_DARK_ORANGE};
`;

interface CriticalCoinjoinPhaseProps {
    relatedAccountKey: string;
}

export const CriticalCoinjoinPhase = ({ relatedAccountKey }: CriticalCoinjoinPhaseProps) => {
    const relatedCoinjoinAccount = useSelector(state =>
        selectCoinjoinAccountByKey(state, relatedAccountKey),
    );

    if (!relatedCoinjoinAccount?.session?.phase) {
        return null;
    }

    return (
        <StyledModal>
            <Content>
                <Image image="DONT_DISCONNECT" />

                <TextContainer>
                    <CoinjoinText>
                        <Translation id="TR_COINJOIN_RUNNING" />
                    </CoinjoinText>
                    <DisconnectText>
                        <Translation id="TR_DO_NOT_DISCONNECT_DEVICE" />
                    </DisconnectText>
                </TextContainer>
            </Content>

            <PhaseProgress currentPhase={relatedCoinjoinAccount?.session?.phase} />
        </StyledModal>
    );
};
