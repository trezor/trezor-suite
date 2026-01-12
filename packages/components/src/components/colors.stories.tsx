import React, { useState } from 'react';

import { Meta } from '@storybook/react';
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
    title: '🎨 Colors',
};
export default meta;

const Sticky = styled.div`
    position: sticky;
    width: 100%;
    top: 0;
    background: ${({ theme }) => theme.backgroundSurfaceElevation0};
`;

type ThemeKey = Exclude<keyof typeof colorVariants, 'debug'>;
const themes: ThemeKey[] = ['standard', 'dark'];

const ThemeVariantIcon = styled.div<{
    currentTheme: ThemeKey;
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

    ${typography['body-xs']}
`;

const v2Tokens = new Set<string>([...Object.keys(colorsV2.light), ...Object.keys(colorsV2.dark)]);

const isV2 = (tokenName: string) => v2Tokens.has(tokenName);
const isV1 = (tokenName: string) => !isV2(tokenName);

const filterColor = (
    colorItems: string[],
    search: string,
    isV1Visible: boolean,
    isV2Visible: boolean,
) =>
    colorItems
        .filter(colorKey => new RegExp(search, 'i').test(colorKey))
        .filter(colorKey => (isV1Visible && isV1(colorKey)) || (isV2Visible && isV2(colorKey)));

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

type ColorFiltersContextValue = {
    search: string;
    isV1Visible: boolean;
    isV2Visible: boolean;
    isColorCodeVisible: boolean;
    setSearch: (value: string) => void;
    toggleV1: () => void;
    toggleV2: () => void;
    toggleColorCode: () => void;
};

const ColorFiltersContext = React.createContext<ColorFiltersContextValue | undefined>(undefined);

const useColorFilters = () => {
    const ctx = React.useContext(ColorFiltersContext);
    if (!ctx) {
        throw new Error('useColorFilters must be used within ColorFiltersContext');
    }

    return ctx;
};

const Header = () => {
    const {
        search,
        setSearch,
        isV1Visible,
        toggleV1,
        isV2Visible,
        toggleV2,
        isColorCodeVisible,
        toggleColorCode,
    } = useColorFilters();

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
                        showClearButton={true}
                        size="small"
                    />
                </Box>
                <Row gap={20}>
                    <Checkbox onChange={toggleV1} isChecked={isV1Visible}>
                        <BadgeV1 />
                    </Checkbox>
                    <Checkbox onChange={toggleV2} isChecked={isV2Visible}>
                        <BadgeV2 />
                    </Checkbox>
                    <Checkbox onChange={toggleColorCode} isChecked={isColorCodeVisible}>
                        #
                    </Checkbox>
                </Row>
            </Row>
            <Divider margin={{ bottom: 0 }} />
        </Sticky>
    );
};

const ColorName = () => {
    const { search, isV1Visible, isV2Visible } = useColorFilters();

    return (
        <Column gap={GAP} justifyContent="center">
            {filterColor(Object.keys(colorVariants.standard), search, isV1Visible, isV2Visible).map(
                name => (
                    <Row key={name} gap={4} alignItems="center" height={COLOR_BOX_SIZE}>
                        <Paragraph isMonospaced typographyStyle="body-xs">
                            {name}
                        </Paragraph>
                        {isV2(name) ? <BadgeV2 /> : <BadgeV1 />}
                    </Row>
                ),
            )}
        </Column>
    );
};

export const Colors = () => {
    const [search, setSearch] = useState('');
    const [isV1Visible, setIsV1Visible] = useState(true);
    const [isV2Visible, setIsV2Visible] = useState(true);
    const [isColorCodeVisible, setIsColorCodeVisible] = useState(false);

    const filters: ColorFiltersContextValue = React.useMemo(
        () => ({
            search,
            isV1Visible,
            isV2Visible,
            isColorCodeVisible,
            setSearch,
            toggleV1: () => setIsV1Visible(prev => !prev),
            toggleV2: () => setIsV2Visible(prev => !prev),
            toggleColorCode: () => setIsColorCodeVisible(prev => !prev),
        }),
        [search, isV1Visible, isV2Visible, isColorCodeVisible],
    );

    return (
        <ColorFiltersContext.Provider value={filters}>
            <Column width="100%">
                <Header />

                <Row gap={GAP} alignItems="flex-start">
                    {themes.map(theme => (
                        <Column key={theme} gap={GAP}>
                            {filterColor(
                                Object.keys(colorVariants[theme]),
                                search,
                                isV1Visible,
                                isV2Visible,
                            ).map(tokenName => (
                                <Color
                                    key={`${theme}-${tokenName}`}
                                    $value={
                                        colorVariants[theme][
                                            tokenName as keyof (typeof colorVariants)[ThemeKey]
                                        ] as CSSColor
                                    }
                                    $isColorCodeVisible={isColorCodeVisible}
                                >
                                    {isColorCodeVisible &&
                                        (colorVariants[theme][
                                            tokenName as keyof (typeof colorVariants)[ThemeKey]
                                        ] as CSSColor)}
                                </Color>
                            ))}
                        </Column>
                    ))}
                    <ColorName />
                </Row>
            </Column>
        </ColorFiltersContext.Provider>
    );
};
