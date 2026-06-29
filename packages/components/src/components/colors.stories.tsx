import React, { useState } from 'react';

import { type Meta } from '@storybook/react';
import styled, { useTheme } from 'styled-components';

import { colorVariants, colorsV2, typography } from '@trezor/theme';
import { hexToRgba, throwError } from '@trezor/utils';

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
    background: ${({ theme }) => theme.surfaceFillPage};
`;

type ThemeKey = keyof typeof colorVariants;
const themes: ThemeKey[] = ['standard', 'dark'];

const colorTokens = Object.keys(colorsV2.light);

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
    background: ${({ currentTheme }) => colorVariants[currentTheme].elementFillNeutralSofter};
    color: ${({ currentTheme }) => colorVariants[currentTheme].contentPrimary};
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
        const outlineColor = hexToRgba(theme.contentPrimaryInverse, 0.7);

        return `text-shadow: 0 0 7px ${outlineColor},0 0 7px ${outlineColor},0 0 4px ${outlineColor};`;
    }}

    ${typography['body-xs']}
`;

const filterColor = (colorItems: string[], search: string) =>
    colorItems.filter(colorKey => new RegExp(search, 'i').test(colorKey));

type ColorFiltersContextValue = {
    search: string;
    isColorCodeVisible: boolean;
    setSearch: (value: string) => void;
    toggleColorCode: () => void;
};

const ColorFiltersContext = React.createContext<ColorFiltersContextValue | undefined>(undefined);

const useColorFilters = () =>
    React.useContext(ColorFiltersContext) ??
    throwError('useColorFilters must be used within ColorFiltersContext');

const Header = () => {
    const { search, setSearch, isColorCodeVisible, toggleColorCode } = useColorFilters();

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
                <Checkbox onChange={toggleColorCode} isChecked={isColorCodeVisible}>
                    #
                </Checkbox>
            </Row>
            <Divider margin={{ bottom: 0 }} />
        </Sticky>
    );
};

const ColorName = () => {
    const { search } = useColorFilters();

    return (
        <Column gap={GAP} justifyContent="center">
            {filterColor(colorTokens, search).map(name => (
                <Row key={name} gap={4} alignItems="center" height={COLOR_BOX_SIZE}>
                    <Paragraph isMonospaced typographyStyle="body-xs">
                        {name}
                    </Paragraph>
                </Row>
            ))}
        </Column>
    );
};

export const Colors = () => {
    const [search, setSearch] = useState('');
    const [isColorCodeVisible, setIsColorCodeVisible] = useState(false);

    const filters: ColorFiltersContextValue = React.useMemo(
        () => ({
            search,
            isColorCodeVisible,
            setSearch,
            toggleColorCode: () => setIsColorCodeVisible(prev => !prev),
        }),
        [search, isColorCodeVisible],
    );

    const filteredTokens = filterColor(colorTokens, search);

    return (
        <ColorFiltersContext.Provider value={filters}>
            <Column width="100%">
                <Header />

                <Row gap={GAP} alignItems="flex-start">
                    {themes.map(theme => (
                        <Column key={theme} gap={GAP}>
                            {filteredTokens.map(tokenName => (
                                <Color
                                    key={`${theme}-${tokenName}`}
                                    $value={
                                        colorVariants[theme][
                                            tokenName as keyof (typeof colorVariants)[ThemeKey]
                                        ]
                                    }
                                    $isColorCodeVisible={isColorCodeVisible}
                                >
                                    {isColorCodeVisible &&
                                        colorVariants[theme][
                                            tokenName as keyof (typeof colorVariants)[ThemeKey]
                                        ]}
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
