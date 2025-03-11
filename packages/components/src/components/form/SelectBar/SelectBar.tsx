import { KeyboardEvent, ReactNode, useCallback, useEffect, useState } from 'react';

import styled, { css } from 'styled-components';

import {
    Elevation,
    borders,
    mapElevationToBackground,
    nextElevation,
    spacings,
} from '@trezor/theme';

import { SelectBarOrientation, SelectBarSize } from './types';
import { mapSizeToPadding, mapSizeToTypographyStyle, mapStateToTextVariant } from './utils';
import { Box, Grid, useMediaQuery } from '../../../';
import { variables } from '../../../config';
import { FrameProps, FramePropsKeys } from '../../../utils/frameProps';
import { focusStyleTransition, getFocusShadowStyle } from '../../../utils/utils';
import { useElevation } from '../../ElevationContext/ElevationContext';
import { Column, Flex } from '../../Flex/Flex';
import { Text } from '../../typography/Text/Text';

export const allowedSelectBarFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedSelectBarFrameProps)[number]>;

const GAP = spacings.xxs;

const getTranslateValue = (index: number = 0) => `calc(${index * 100}% + ${index * GAP}px)`;

const getPuckDimension = (optionsCount: number) =>
    `calc((100% - ${(optionsCount - 1) * GAP}px) / ${optionsCount})`;

const Options = styled.div<{ $elevation: Elevation }>`
    background: ${mapElevationToBackground};
    border-radius: ${borders.radii.lg};
    flex: 1;
`;

const Puck = styled.div<{
    $optionsCount: number;
    $selectedIndex: number;
    $elevation: Elevation;
    $orientation: SelectBarOrientation;
}>`
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: ${({ $optionsCount }) => getPuckDimension($optionsCount)};
    background: ${mapElevationToBackground};
    border-radius: ${borders.radii.full};
    box-shadow: ${({ theme, $elevation }) => $elevation === 1 && theme.boxShadowBase};
    transform: ${({ $selectedIndex }) => `translateX(${getTranslateValue($selectedIndex)})`};
    transition:
        transform 0.175s cubic-bezier(1, 0.02, 0.38, 0.74),
        ${focusStyleTransition};

    ${getFocusShadowStyle()}

    ${({ $orientation, $selectedIndex, $optionsCount }) =>
        $orientation === 'vertical' &&
        css`
            bottom: auto;
            right: 0;
            width: auto;
            height: ${getPuckDimension($optionsCount)};
            transform: ${`translateY(${getTranslateValue($selectedIndex)})`};
        `}
`;

const Option = styled.div<{ $isSelected: boolean; $isDisabled: boolean }>`
    position: relative;
    transition: color 0.175s;

    &:hover {
        color: ${({ theme, $isSelected, $isDisabled }) =>
            !$isSelected && !$isDisabled && theme.textDefault};
    }
`;

type ValueTypes = number | string | boolean;

type Option<V extends ValueTypes> = {
    label: ReactNode;
    value: V;
};

export type SelectBarProps<V extends ValueTypes> = {
    label?: ReactNode;
    options: Option<V>[];
    selectedOption?: V;
    onChange?: (value: V) => void;
    isDisabled?: boolean;
    isFullWidth?: boolean;
    orientation?: SelectBarOrientation;
    size?: SelectBarSize;
    'data-testid'?: string;
} & AllowedFrameProps;

// Generic type V is determined by selectedOption/options values
export const SelectBar = <V extends ValueTypes>({
    label,
    options,
    selectedOption,
    onChange,
    isDisabled = false,
    isFullWidth,
    orientation = 'auto',
    size = 'large',
    'data-testid': dataTest,
    margin,
}: SelectBarProps<V>) => {
    const [selectedOptionIn, setSelected] = useState<ValueTypes | undefined>(selectedOption);
    const { elevation } = useElevation();
    const isBelowMobile = useMediaQuery(`(max-width: ${variables.SCREEN_SIZE.SM})`);

    useEffect(() => {
        if (selectedOption !== undefined) {
            setSelected(selectedOption);
        }
    }, [selectedOption, setSelected]);

    const handleOptionClick = useCallback(
        (option: Option<V>) => () => {
            if (isDisabled || option.value === selectedOptionIn) {
                return;
            }

            setSelected(option.value);

            onChange?.(option?.value);
        },
        [isDisabled, selectedOptionIn, onChange],
    );

    const handleKeyboardNav = (e: KeyboardEvent) => {
        const selectedOptionIndex = options.findIndex(option => option.value === selectedOptionIn);

        let option;
        if (e.key === 'ArrowLeft') {
            const previousIndex = selectedOptionIndex - 1;

            if (previousIndex >= 0) {
                option = options[previousIndex];
            } else {
                option = options[options.length - 1];
            }
        } else if (e.key === 'ArrowRight') {
            const previousIndex = selectedOptionIndex + 1;

            if (previousIndex <= options.length - 1) {
                option = options[previousIndex];
            } else {
                [option] = options;
            }
        }

        if (option) {
            setSelected(option.value);
            handleOptionClick(option)();
        }
    };

    const selectedIndex = options.findIndex(option => option.value === selectedOptionIn);
    const isVertical = orientation === 'vertical' || (orientation === 'auto' && isBelowMobile);

    return (
        <Flex
            data-testid={dataTest}
            direction={isVertical ? 'column' : 'row'}
            margin={margin}
            width={isFullWidth || isVertical ? '100%' : 'auto'}
            alignItems={isVertical ? 'stretch' : 'center'}
            gap={spacings.sm}
        >
            {label && (
                <Text
                    case="capitalize"
                    variant="tertiary"
                    typographyStyle={mapSizeToTypographyStyle(size)}
                >
                    {label}
                </Text>
            )}

            <Options $elevation={elevation}>
                <Box margin={spacings.xxs} position={{ type: 'relative' }}>
                    <Puck
                        $optionsCount={options.length}
                        $selectedIndex={selectedIndex}
                        $elevation={nextElevation[elevation]}
                        $orientation={isVertical ? 'vertical' : orientation}
                        tabIndex={0}
                        onKeyDown={handleKeyboardNav}
                    />
                    <Grid columns={isVertical ? 1 : options.length} gap={GAP}>
                        {options.map(option => {
                            const isSelected =
                                selectedOptionIn !== undefined
                                    ? selectedOptionIn === option.value
                                    : false;

                            return (
                                <Text
                                    key={String(option.value)}
                                    variant={mapStateToTextVariant(isDisabled, isSelected)}
                                    typographyStyle={mapSizeToTypographyStyle(size, isSelected)}
                                    case="capitalize"
                                    textWrap="nowrap"
                                    as="div"
                                    cursor={isDisabled ? 'not-allowed' : 'pointer'}
                                >
                                    <Option
                                        onClick={handleOptionClick(option)}
                                        $isDisabled={!!isDisabled}
                                        $isSelected={isSelected}
                                        data-testid={`select-bar/${String(option.value)}`}
                                    >
                                        <Column
                                            padding={mapSizeToPadding(size)}
                                            alignItems="center"
                                        >
                                            {option.label}
                                            <Box height={0} overflow="hidden">
                                                <Text typographyStyle="highlight">
                                                    {option.label}
                                                </Text>
                                            </Box>
                                        </Column>
                                    </Option>
                                </Text>
                            );
                        })}
                    </Grid>
                </Box>
            </Options>
        </Flex>
    );
};
