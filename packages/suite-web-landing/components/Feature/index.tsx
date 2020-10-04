import React, { ReactNode } from 'react';
import styled from 'styled-components';
import { colors, variables } from '@trezor/components';

const Feature = styled.section<Props>`
    position: relative;
    display: flex;
    flex: 1;
    border-radius: 40px;
    background: ${colors.BLACK96};
    flex-direction: ${props => (props.flip === true ? 'row-reverse' : 'row')};
    overflow: hidden;
    padding: 40px 0;

    @media only screen and (min-width: ${variables.SCREEN_SIZE.MD}) {
        min-height: 416px;
        padding: 0;
    }
`;

const StyledText = styled.div<{ flip?: boolean }>`
    display: flex;
    flex: 1;
    align-items: center;
    margin: 0 50px;
    z-index: 1;
    position: relative;

    &:after {
        position: absolute;
        width: 70%;
        height: 100%;
        content: '';
        top: 0;
        z-index: -1;
    }

    &:before {
        position: absolute;
        width: 100%;
        height: 100%;
        content: '';
        left: 0;
        top: 0;
        z-index: -1;
    }

    ${props =>
        props.flip === false &&
        `
            &:after {
                right: -70%;
                background: linear-gradient(to left, transparent 0%, ${colors.BLACK96} 100%);
            }

            &:before {
                left: 0;
                background: ${colors.BLACK96};
                z-index: -1;
            }
        `}

    ${props =>
        props.flip === true &&
        `
            &:after {
                left: -70%;
                background: linear-gradient(to right, transparent 0%, ${colors.BLACK96} 100%);
            }

            &:before {
                right: 0;
                background: ${colors.BLACK96};
            }
        `}

    @media only screen and (min-width: ${variables.SCREEN_SIZE.XL}) {
        &:before {
            display: none;
        }
        &:after {
            display: none;
        }
    }

    @media only screen and (min-width: ${variables.SCREEN_SIZE.MD}) {
        max-width: 50%;
        margin-left: 100px;
        white-space: pre-wrap;
    }
`;

const FeatureImage = styled.div<{ image: string; flip?: boolean; backgroundPosition?: string }>`
    position: absolute;
    background: url(${props => props.image}) no-repeat;
    width: 100%;
    height: 100%;
    display: none;

    @media only screen and (min-width: ${variables.SCREEN_SIZE.MD}) {
        display: block;
        background-position: ${props =>
            props.backgroundPosition !== undefined
                ? props.backgroundPosition
                : `center ${props.flip === true ? 'left' : 'right'} 32px`};
    }
`;

interface Props {
    children: ReactNode;
    flip?: boolean;
    backgroundPosition?: string;
    image: string;
}

const Index = ({ children, flip, image, backgroundPosition }: Props) => (
    <Feature flip={flip}>
        <StyledText flip={flip}>
            <div>{children}</div>
        </StyledText>
        <FeatureImage image={image} flip={flip} backgroundPosition={backgroundPosition} />
    </Feature>
);

export default Index;
