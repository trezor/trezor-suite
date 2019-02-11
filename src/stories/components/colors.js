import React from 'react';
import colors from 'config/colors';
import { storiesOf } from '@storybook/react';
import styled from 'styled-components';

const Wrapper = styled.div`
    display: flex;
    width: 150px;
    flex-direction: row;
`;

const ColorBox = styled.div`
    max-width: 90px;
    height: 20px;
    padding: 20px;
    display: flex;
    display: block;
    justify-content: center;
    align-items: center;
    background: ${props => props.color};
    border: 1px solid black;
`;

storiesOf('Colors', module)
    .addWithJSX('colors', () => (
        <Wrapper>
            <ColorBox color={colors.WHITE}>{colors.WHITE}</ColorBox>
            <ColorBox color={colors.BACKGROUND}>{colors.BACKGROUND}</ColorBox>
            <ColorBox color={colors.HEADER}>{colors.HEADER}</ColorBox>
            <ColorBox color={colors.BODY}>{colors.BODY}</ColorBox>
            <ColorBox color={colors.LANDING}>{colors.LANDING}</ColorBox>
            <ColorBox color={colors.TEXT_PRIMARY}>{colors.TEXT_PRIMARY}</ColorBox>
            <ColorBox color={colors.TEXT_SECONDARY}>{colors.TEXT_SECONDARY}</ColorBox>
            <ColorBox color={colors.LABEL_COLOR}>{colors.LABEL_COLOR}</ColorBox>
            <ColorBox color={colors.GRAY_LIGHT}>{colors.GRAY_LIGHT}</ColorBox>
            <ColorBox color={colors.DIVIDER}>{colors.DIVIDER}</ColorBox>
            <ColorBox color={colors.GREEN_PRIMARY}>{colors.GREEN_PRIMARY}</ColorBox>
            <ColorBox color={colors.GREEN_SECONDARY}>{colors.GREEN_SECONDARY}</ColorBox>
            <ColorBox color={colors.GREEN_TERTIARY}>{colors.GREEN_TERTIARY}</ColorBox>
            <ColorBox color={colors.SUCCESS_PRIMARY}>{colors.SUCCESS_PRIMARY}</ColorBox>
            <ColorBox color={colors.SUCCESS_SECONDARY}>{colors.SUCCESS_SECONDARY}</ColorBox>
            <ColorBox color={colors.INFO_PRIMARY}>{colors.INFO_PRIMARY}</ColorBox>
            <ColorBox color={colors.INFO_SECONDARY}>{colors.INFO_SECONDARY}</ColorBox>
            <ColorBox color={colors.WARNING_PRIMARY}>{colors.WARNING_PRIMARY}</ColorBox>
            <ColorBox color={colors.WARNING_SECONDARY}>{colors.WARNING_SECONDARY}</ColorBox>
            <ColorBox color={colors.ERROR_PRIMARY}>{colors.ERROR_PRIMARY}</ColorBox>
            <ColorBox color={colors.ERROR_SECONDARY}>{colors.ERROR_SECONDARY}</ColorBox>
            <ColorBox color={colors.TOOLTIP_BACKGROUND}>{colors.TOOLTIP_BACKGROUND}</ColorBox>
        </Wrapper>
    ));