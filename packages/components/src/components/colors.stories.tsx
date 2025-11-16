import React from 'react';

import { Meta, StoryFn } from '@storybook/react';
import styled from 'styled-components';

import { colorVariants } from '@trezor/theme';

import { Column, Row } from './Flex/Flex';
import { Text } from './typography/Text/Text';

const ITEM_HEIGHT = 30;
const GAP = 8;
const meta: Meta<any> = {
    title: 'Colors',
};
export default meta;

const Sticky = styled.div`
    position: sticky;
    top: 0;
    background: ${({ theme }) => theme.backgroundSurfaceElevation0};
    border-bottom: solid 3px ${({ theme }) => theme.backgroundSurfaceElevation0};
    border-top: solid 3px ${({ theme }) => theme.backgroundSurfaceElevation0};
`;
const Name = styled.div`
    height: ${ITEM_HEIGHT}px;
    line-height: ${ITEM_HEIGHT}px;
`;
const Heading = styled.div<{ currentTheme: typeof colorVariants }>`
    width: ${ITEM_HEIGHT}px;
    height: ${ITEM_HEIGHT}px;
    line-height: ${ITEM_HEIGHT}px;
    text-align: center;
    font-size: 9px;
    font-weight: 900;
    background: ${({ currentTheme }) =>
        colorVariants[currentTheme].backgroundNeutralSubtleOnElevation0};
    color: ${({ currentTheme }) => colorVariants[currentTheme].textDefault};
`;

const Color = styled.div<{ value: string }>`
    width: ${ITEM_HEIGHT}px;
    height: ${ITEM_HEIGHT}px;
    background: ${({ value }) => value};
    border-radius: 6px;
`;

const themes = ['standard', 'dark'];

export const Colors: StoryFn<typeof meta> = () => (
    <Column>
        <Sticky>
            <Row gap={GAP}>
                <Heading currentTheme="standard">Light</Heading>
                <Heading currentTheme="dark">Dark</Heading>
            </Row>
        </Sticky>
        <Row gap={GAP} alignItems="flex-start">
            {themes.map(theme => (
                <Column key={theme} gap={GAP}>
                    {Object.values(colorVariants[theme]).map(value => (
                        <Color key={`standard-${value}`} value={value} />
                    ))}
                </Column>
            ))}
            <Column gap={GAP} key={name} justifyContent="center">
                {Object.keys(colorVariants.standard).map(name => (
                    <Name key={name}>
                        <Text isMonospaced typographyStyle="label">
                            {name}
                        </Text>
                    </Name>
                ))}
            </Column>
        </Row>
    </Column>
);
