import React, { ReactNode } from 'react';
import styled from 'styled-components';
import { colors } from '@trezor/components';

const Feature = styled.section<Props>`
    position: relative;
    display: flex;
    flex: 1;
    border-radius: 40px;
    background: ${colors.BLACK96};
    min-height: 416px;
    flex-direction: ${props => (props.flip === true ? 'row-reverse' : 'row')};
    overflow: hidden;
`;

const StyledText = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    margin-left: 100px;
    white-space: pre-wrap;
    z-index: 1;
    max-width: 50%;
`;

const FeatureImage = styled.div<{ image: string; flip?: boolean; backgroundPosition?: string }>`
    position: absolute;
    background: url(${props => props.image}) no-repeat;
    background-position: ${props =>
        props.backgroundPosition !== undefined
            ? props.backgroundPosition
            : `center ${props.flip === true ? 'left' : 'right'} 32px`};
    width: 100%;
    height: 100%;
`;

interface Props {
    children: ReactNode;
    flip?: boolean;
    backgroundPosition?: string;
    image: string;
}

const Index = ({ children, flip, image, backgroundPosition }: Props) => (
    <Feature flip={flip}>
        <StyledText>
            <div>{children}</div>
        </StyledText>
        <FeatureImage image={image} flip={flip} backgroundPosition={backgroundPosition} />
    </Feature>
);

export default Index;
