import { ReactNode } from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';

const Container = styled.div`
    display: flex;

    & + & {
        margin-top: 28px;
    }
`;

const TextContainer = styled.div`
    display: flex;
    flex-direction: column;
    text-align: left;
    width: 100%;
    margin-left: 18px;
`;

const Number = styled.div`
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    background-color: ${({ theme }) => theme.STROKE_GREY};
    border-radius: 50%;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: 13px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    text-align: center;
`;

const Title = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    margin-bottom: 8px;
`;

const Description = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

interface InstructionStepProps {
    number: string;
    title: ReactNode;
    children: ReactNode;
}

export const InstructionStep = ({ number, title, children }: InstructionStepProps) => (
    <Container>
        <Number>{number}</Number>

        <TextContainer>
            <Title>{title}</Title>
            <Description> {children}</Description>
        </TextContainer>
    </Container>
);
