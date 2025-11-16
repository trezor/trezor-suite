import React, { useState } from 'react';

import { Meta, StoryFn } from '@storybook/react';
import styled, { useTheme } from 'styled-components';

import { CSSColor, colorVariants, colorsV2, typography } from '@trezor/theme';
import { hexToRgba } from '@trezor/utils';

import { Badge } from './Badge/Badge';
import { Box } from './Box/Box';
import { Divider } from './Divider/Divider';
import { Column, Row } from './Flex/Flex';
import { Checkbox } from './form/Checkbox/Checkbox';
import { Input } from './form/Input/Input';
import { Paragraph } from './typography/Paragraph/Paragraph';

const COLOR_BOX_SIZE = 30;
const COLOR_BOX_WITH_HEX_WIDTH = 80;
const GAP = 8;
const meta: Meta<any> = {
    title: 'Colors',
};
export default meta;

const Sticky = styled.div`
    position: sticky;
    width: 100%;
    top: 0;
    background: ${({ theme }) => theme.backgroundSurfaceElevation0};
`;

const ThemeVariantIcon = styled.div<{
    currentTheme: typeof colorVariants;
    $isColorCodeVisible: boolean;
}>`
    width: ${({ $isColorCodeVisible }) =>
        $isColorCodeVisible ? COLOR_BOX_WITH_HEX_WIDTH : COLOR_BOX_SIZE}px;
    height: ${COLOR_BOX_SIZE}px;
    line-height: ${COLOR_BOX_SIZE}px;
    text-align: center;
    font-size: 9px;
    font-weight: 900;
    background: ${({ currentTheme }) =>
        colorVariants[currentTheme].backgroundNeutralSubtleOnElevation0};
    color: ${({ currentTheme }) => colorVariants[currentTheme].textDefault};
`;

const Color = styled.div<{ $value: string; $isColorCodeVisible: boolean }>`
    width: ${({ $isColorCodeVisible }) =>
        $isColorCodeVisible ? COLOR_BOX_WITH_HEX_WIDTH : COLOR_BOX_SIZE}px;
    height: ${COLOR_BOX_SIZE}px;
    background: ${({ $value }) => $value};
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    ${({ theme }) => {
        const outlineColor = hexToRgba(theme.textDefaultInverted, 0.7);

        return `text-shadow: 0 0 7px ${outlineColor},0 0 7px ${outlineColor},0 0 4px ${outlineColor};`;
    }}

    ${typography.label}
`;

const themes = ['standard', 'dark'];

const isV2 = (color: CSSColor) => `${color}` in colorsV2.light;
const isV1 = (color: CSSColor) => !isV2(color);

const filterColor = (
    colorItems: Array<CSSColor>,
    search: string,
    isV1Visible: boolean,
    isV2Visible: boolean,
) =>
    colorItems
        .filter(colorKey => new RegExp(search, 'i').test(colorKey))
        .filter(color => (isV1Visible && isV1(color)) || (isV2Visible && isV2(color)));

const BadgeV1 = () => (
    <Badge intent="warning" size="small">
        v1
    </Badge>
);
const BadgeV2 = () => (
    <Badge intent="brand" size="small">
        v2
    </Badge>
);

const Header = ({
    setSearch,
    search,
    isV1Visible,
    setIsV1Visible,
    isV2Visible,
    setIsV2Visible,
    isColorCodeVisible,
    setIsColorCodeVisible,
}: {
    search: string;
    setSearch: (search: string) => void;
    isV1Visible: boolean;
    setIsV1Visible: (isV1Visible: boolean) => void;
    isV2Visible: boolean;
    setIsV2Visible: (isV2Visible: boolean) => void;
    isColorCodeVisible: boolean;
    setIsColorCodeVisible: (isV2Visible: boolean) => void;
}) => {
    const theme = useTheme();

    return (
        <Sticky>
            <Row gap={GAP} margin={{ vertical: 8 }}>
                <ThemeVariantIcon currentTheme="standard" $isColorCodeVisible={isColorCodeVisible}>
                    Light
                </ThemeVariantIcon>
                <ThemeVariantIcon currentTheme="dark" $isColorCodeVisible={isColorCodeVisible}>
                    Dark
                </ThemeVariantIcon>
                <Box flex="1">
                    <Input
                        placeholder="Search color"
                        value={search}
                        onChange={event => setSearch(event.target.value)}
                        // eslint-disable-next-line jsx-a11y/no-autofocus
                        autoFocus={theme.variant === 'light'}
                        onClear={() => setSearch('')}
                        showClearButton="always"
                        size="small"
                    />
                </Box>
                <Row gap={20}>
                    <Checkbox onClick={() => setIsV1Visible(!isV1Visible)} isChecked={isV1Visible}>
                        <BadgeV1 />
                    </Checkbox>
                    <Checkbox onClick={() => setIsV2Visible(!isV2Visible)} isChecked={isV2Visible}>
                        <BadgeV2 />
                    </Checkbox>
                    <Checkbox
                        onClick={() => setIsColorCodeVisible(!isColorCodeVisible)}
                        isChecked={isColorCodeVisible}
                    >
                        #
                    </Checkbox>
                </Row>
            </Row>
            <Divider margin={{ bottom: 0 }} />
        </Sticky>
    );
};

const ColorName = ({
    search,
    isV1Visible,
    isV2Visible,
}: {
    search: string;
    isV1Visible: boolean;
    isV2Visible: boolean;
}) => (
    <Column gap={GAP} justifyContent="center">
        {filterColor(Object.keys(colorVariants.standard), search, isV1Visible, isV2Visible).map(
            name => (
                <Row key={name} gap={4} alignItems="center" height={COLOR_BOX_SIZE}>
                    <Paragraph isMonospaced typographyStyle="label">
                        {name}
                    </Paragraph>
                    {isV2(name) ? <BadgeV2 /> : <BadgeV1 />}
                </Row>
            ),
        )}
    </Column>
);
export const Colors: StoryFn<typeof meta> = () => {
    const [search, setSearch] = useState('');
    const [isV1Visible, setIsV1Visible] = useState(true);
    const [isV2Visible, setIsV2Visible] = useState(true);
    const [isColorCodeVisible, setIsColorCodeVisible] = useState(false);

    return (
        <Column width="100%">
            <Header
                search={search}
                setSearch={setSearch}
                isV1Visible={isV1Visible}
                setIsV1Visible={setIsV1Visible}
                isV2Visible={isV2Visible}
                setIsV2Visible={setIsV2Visible}
                isColorCodeVisible={isColorCodeVisible}
                setIsColorCodeVisible={setIsColorCodeVisible}
            />

            <Row gap={GAP} alignItems="flex-start">
                {themes.map(theme => (
                    <Column key={theme} gap={GAP}>
                        {filterColor(
                            Object.keys(colorVariants[theme]),
                            search,
                            isV1Visible,
                            isV2Visible,
                        ).map(value => (
                            <Color
                                key={`${theme}-${value}`}
                                $value={colorVariants[theme][value]}
                                $isColorCodeVisible={isColorCodeVisible}
                            >
                                {isColorCodeVisible && colorVariants[theme][value]}
                            </Color>
                        ))}
                    </Column>
                ))}
                <ColorName search={search} isV2Visible={isV2Visible} isV1Visible={isV1Visible} />
            </Row>
        </Column>
    );
};
