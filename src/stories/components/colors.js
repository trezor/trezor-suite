import React from 'react';
import colors from 'config/colors';
import { storiesOf } from '@storybook/react';
import styled from 'styled-components';
import { H1 } from 'components/Heading';

const Section = styled.div``;

const Wrapper = styled.div`
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
`;

const ColorBox = styled.div`
    text-align: center;
    width: 15%;
    height: 20px;
    padding: 20px;
    display: flex;
    margin: 0 10px 10px 0;
    justify-content: center;
    align-items: center;
    background: ${props => props.color};
    border-radius: 5px;
`;

storiesOf('Colors', module)
    .add('colors', () => (
        <Section>
            <H1>Main</H1>
            <Wrapper>
                <ColorBox color={colors.WHITE}>White<br />{colors.WHITE}</ColorBox>
                <ColorBox color={colors.BACKGROUND}>Background<br />{colors.BACKGROUND}</ColorBox>
                <ColorBox color={colors.HEADER}>Header<br />{colors.HEADER}</ColorBox>
                <ColorBox color={colors.BODY}>Body<br />{colors.BODY}</ColorBox>
                <ColorBox color={colors.LANDING}>Landing<br />{colors.LANDING}</ColorBox>
                <ColorBox color={colors.GREEN_PRIMARY}>Primary<br />{colors.GREEN_PRIMARY}</ColorBox>
                <ColorBox color={colors.GREEN_SECONDARY}>Secondary<br />{colors.GREEN_SECONDARY}</ColorBox>
                <ColorBox color={colors.GREEN_TERTIARY}>Tertiary<br />{colors.GREEN_TERTIARY}</ColorBox>
            </Wrapper>
            <H1>Text</H1>
            <Wrapper>
                <ColorBox color={colors.TEXT_PRIMARY}>Primary<br />{colors.TEXT_PRIMARY}</ColorBox>
                <ColorBox color={colors.TEXT_SECONDARY}>Secondary<br />{colors.TEXT_SECONDARY}</ColorBox>
                <ColorBox color={colors.LABEL_COLOR}>Label<br />{colors.LABEL_COLOR}</ColorBox>
                <ColorBox color={colors.GRAY_LIGHT}>Gray<br />{colors.GRAY_LIGHT}</ColorBox>
                <ColorBox color={colors.TOOLTIP_BACKGROUND}>Tooltip<br />{colors.TOOLTIP_BACKGROUND}</ColorBox>
                <ColorBox color={colors.DIVIDER}>Divider<br />{colors.DIVIDER}</ColorBox>
            </Wrapper>
            <H1>State</H1>
            <Wrapper>
                <ColorBox color={colors.SUCCESS_PRIMARY}>Success<br />{colors.SUCCESS_PRIMARY}</ColorBox>
                <ColorBox color={colors.SUCCESS_SECONDARY}>Success<br />{colors.SUCCESS_SECONDARY}</ColorBox>
                <ColorBox color={colors.INFO_PRIMARY}>Info<br />{colors.INFO_PRIMARY}</ColorBox>
                <ColorBox color={colors.INFO_SECONDARY}>Info<br />{colors.INFO_SECONDARY}</ColorBox>
                <ColorBox color={colors.WARNING_PRIMARY}>Warning<br />{colors.WARNING_PRIMARY}</ColorBox>
                <ColorBox color={colors.WARNING_SECONDARY}>Warning<br />{colors.WARNING_SECONDARY}</ColorBox>
                <ColorBox color={colors.ERROR_PRIMARY}>Error<br />{colors.ERROR_PRIMARY}</ColorBox>
                <ColorBox color={colors.ERROR_SECONDARY}>Error<br />{colors.ERROR_SECONDARY}</ColorBox>
            </Wrapper>
        </Section>
    ));