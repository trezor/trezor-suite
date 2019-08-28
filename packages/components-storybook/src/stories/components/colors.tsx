import React from 'react';
import { colors, H1, H2 } from '@trezor/components';
import styled from 'styled-components';

type ColorBoxProps = { color: string; textColor?: string };

const Section = styled.div`
    padding: 1.6rem;
`;

const Color = styled.div`
    margin-bottom: 2rem;
`;

const ColorBox = styled.div<ColorBoxProps>`
    text-align: center;
    height: 20px;
    padding: 20px;
    display: flex;
    margin: 0;
    justify-content: center;
    align-items: center;
    background: ${props => props.color};
    border-radius: 5px;
    color: ${props => props.textColor || 'inherit'};
    box-shadow: 0 1px 15px rgba(0, 0, 0, 0.2);
`;

const Wrapper = styled.div`
    display: flex;
    margin-top: 30px;
    text-align: center;
    justify-content: space-evenly;
`;
const Column = styled.div`
    flex-direction: column;
`;

const Code = styled.pre`
    font-size: 0.88em;
    font-family: Menlo, Monaco, 'Courier New', monospace;
    background-color: rgb(250, 250, 250);
    padding: 0.5rem;
    line-height: 1.5;
    overflow-x: scroll;
`;

const Title = styled.div`
    margin-bottom: 0.5rem;
`;

export default () => (
    <Section>
        <H1>Colors</H1>
        <Code>{"import { colors } from 'trezor-ui-components';"}</Code>
        <Wrapper>
            <Column>
                <H2>Backgrounds</H2>
                <Color>
                    <Title>WHITE</Title>
                    <ColorBox color={colors.WHITE}>{colors.WHITE}</ColorBox>
                </Color>
                <Color>
                    <Title>MAIN</Title>
                    <ColorBox color={colors.MAIN}>{colors.MAIN}</ColorBox>
                </Color>
                <Color>
                    <Title>LANDING</Title>
                    <ColorBox color={colors.LANDING}>{colors.LANDING}</ColorBox>
                </Color>
                <Color>
                    <Title>BACKGROUND</Title>
                    <ColorBox color={colors.BACKGROUND}>{colors.BACKGROUND}</ColorBox>
                </Color>
                <Color>
                    <Title>HEADER</Title>
                    <ColorBox color={colors.HEADER} textColor={colors.WHITE}>
                        {colors.HEADER}
                    </ColorBox>
                </Color>
            </Column>
            <Column>
                <H2>Text</H2>
                <Color>
                    <Title>GRAY_LIGHT</Title>
                    <ColorBox color={colors.GRAY_LIGHT}>{colors.GRAY_LIGHT}</ColorBox>
                </Color>
                <Color>
                    <Title>DIVIDER</Title>
                    <ColorBox color={colors.DIVIDER}>{colors.DIVIDER}</ColorBox>
                </Color>
                <Color>
                    <Title>LABEL_COLOR</Title>
                    <ColorBox color={colors.LABEL_COLOR}>{colors.LABEL_COLOR}</ColorBox>
                </Color>
                <Color>
                    <Title>TEXT_SECONDARY</Title>
                    <ColorBox color={colors.TEXT_SECONDARY} textColor={colors.WHITE}>
                        {colors.TEXT_SECONDARY}
                    </ColorBox>
                </Color>
                <Color>
                    <Title>TEXT_PRIMARY</Title>
                    <ColorBox color={colors.TEXT_PRIMARY} textColor={colors.WHITE}>
                        {colors.TEXT_PRIMARY}
                    </ColorBox>
                </Color>
                <Color>
                    <Title>TEXT</Title>
                    <ColorBox color={colors.TEXT} textColor={colors.WHITE}>
                        {colors.TEXT}
                    </ColorBox>
                </Color>
                <Color>
                    <Title>TOOLTIP_BACKGROUND</Title>
                    <ColorBox color={colors.TOOLTIP_BACKGROUND} textColor={colors.WHITE}>
                        {colors.TOOLTIP_BACKGROUND}
                    </ColorBox>
                </Color>
            </Column>
            <Column>
                <H2>Colors</H2>
                <Color>
                    <Title>GREEN_PRIMARY</Title>
                    <ColorBox color={colors.GREEN_PRIMARY}>{colors.GREEN_PRIMARY}</ColorBox>
                </Color>
                <Color>
                    <Title>GREEN_SECONDARY</Title>
                    <ColorBox color={colors.GREEN_SECONDARY}>{colors.GREEN_SECONDARY}</ColorBox>
                </Color>
                <Color>
                    <Title>GREEN_TERTIARY</Title>
                    <ColorBox color={colors.GREEN_TERTIARY}>{colors.GREEN_TERTIARY}</ColorBox>
                </Color>
                <Color>
                    <Title>SUCCESS_PRIMARY</Title>
                    <ColorBox color={colors.SUCCESS_PRIMARY}>{colors.SUCCESS_PRIMARY}</ColorBox>
                </Color>
                <Color>
                    <Title>SUCCESS_SECONDARY</Title>
                    <ColorBox color={colors.SUCCESS_SECONDARY}>{colors.SUCCESS_SECONDARY}</ColorBox>
                </Color>
                <Color>
                    <Title>SUCCESS_LIGHT</Title>
                    <ColorBox color={colors.SUCCESS_LIGHT}>{colors.SUCCESS_LIGHT}</ColorBox>
                </Color>
                <Color>
                    <Title>INFO_PRIMARY</Title>
                    <ColorBox color={colors.INFO_PRIMARY}>{colors.INFO_PRIMARY}</ColorBox>
                </Color>
                <Color>
                    <Title>INFO_SECONDARY</Title>
                    <ColorBox color={colors.INFO_SECONDARY}>{colors.INFO_SECONDARY}</ColorBox>
                </Color>
                <Color>
                    <Title>INFO_LIGHT</Title>
                    <ColorBox color={colors.INFO_LIGHT}>{colors.INFO_LIGHT}</ColorBox>
                </Color>
                <Color>
                    <Title>WARNING_PRIMARY</Title>
                    <ColorBox color={colors.WARNING_PRIMARY}>{colors.WARNING_PRIMARY}</ColorBox>
                </Color>
                <Color>
                    <Title>WARNING_SECONDARY</Title>
                    <ColorBox color={colors.WARNING_SECONDARY}>{colors.WARNING_SECONDARY}</ColorBox>
                </Color>
                <Color>
                    <Title>WARNING_LIGHT</Title>
                    <ColorBox color={colors.WARNING_LIGHT}>{colors.WARNING_LIGHT}</ColorBox>
                </Color>
                <Color>
                    <Title>ERROR_PRIMARY</Title>
                    <ColorBox color={colors.ERROR_PRIMARY}>{colors.ERROR_PRIMARY}</ColorBox>
                </Color>
                <Color>
                    <Title>ERROR_SECONDARY</Title>
                    <ColorBox color={colors.ERROR_SECONDARY}>{colors.ERROR_SECONDARY}</ColorBox>
                </Color>
                <Color>
                    <Title>ERROR_LIGHT</Title>
                    <ColorBox color={colors.ERROR_LIGHT}>{colors.ERROR_LIGHT}</ColorBox>
                </Color>
            </Column>
        </Wrapper>
    </Section>
);
