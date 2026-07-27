import { type KeyboardEvent, type ReactNode, useCallback, useEffect, useState } from 'react';

import styled, { css } from 'styled-components';

import { type SelectBarOrientation, type SelectBarSize } from './types';
import { mapSizeToPadding, mapSizeToTypographyStyle, mapStateToTextIntent } from './utils';
import { variables } from '../../../config';
import { type FrameProps, type FramePropsKeys } from '../../../utils/frameProps';
import { useMediaQuery } from '../../../utils/useMediaQuery';
import { commonFocusStyles, focusStyleTransition } from '../../../utils/utils';
import { Box } from '../../Box/Box';
import { Column, Flex } from '../../Flex/Flex';
import { Grid } from '../../Grid/Grid';
import { Text } from '../../typography/Text/Text';

export const allowedSelectBarFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedSelectBarFrameProps)[number]>;

const GAP = 4;

const getTranslateValue = (index: number = 0) => `calc(${index * 100}% + ${index * GAP}px)`;

const getPuckDimension = (optionsCount: number) =>
    `calc((100% - ${(optionsCount - 1) * GAP}px) / ${optionsCount})`;

const Options = styled.div`
    background: ${({ theme }) => theme.elementFillNeutralSofter};
    border: 1px solid ${({ theme }) => theme.elementBorderNeutralSofterAlt};
    border-radius: 20px;
    flex: 1;
    min-width: 0;
`;

const Puck = styled.div<{
    $optionsCount: number;
    $selectedIndex: number;
    $orientation: SelectBarOrientation;
}>`
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: ${({ $optionsCount }) => getPuckDimension($optionsCount)};
    background: ${({ theme }) => theme.elementFillElevated};
    border-radius: calc(infinity * 1px);
    box-shadow: ${({ theme }) => theme.elementShadowElevated};
    transform: ${({ $selectedIndex }) => `translateX(${getTranslateValue($selectedIndex)})`};
    transition:
        transform 0.175s cubic-bezier(1, 0.02, 0.38, 0.74),
        ${focusStyleTransition};

    &:focus-visible {
        ${commonFocusStyles}
    }

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
    width: 100%;
    min-width: 0;
    overflow: hidden;
    transition: color 0.175s;

    &:hover {
        color: ${({ theme, $isSelected, $isDisabled }) =>
            !$isSelected && !$isDisabled && theme.contentPrimary};
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
    onOptionClick?: (value: V) => void;
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
    onOptionClick,
    isDisabled = false,
    isFullWidth,
    orientation = 'auto',
    size = 'large',
    'data-testid': dataTest,
    margin,
}: SelectBarProps<V>) => {
    const [selectedOptionIn, setSelected] = useState<ValueTypes | undefined>(selectedOption);
    const isBelowMobile = useMediaQuery(`(max-width: ${variables.SCREEN_SIZE.SM})`);

    useEffect(() => {
        if (selectedOption !== undefined) {
            setSelected(selectedOption);
        }
    }, [selectedOption, setSelected]);

    const handleOptionClick = useCallback(
        (option: Option<V>) => () => {
            if (isDisabled) {
                return;
            }

            onOptionClick?.(option.value);

            if (option.value === selectedOptionIn) {
                return;
            }

            setSelected(option.value);

            onChange?.(option?.value);
        },
        [isDisabled, onOptionClick, selectedOptionIn, onChange],
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
            gap={12}
        >
            {label && (
                <Text
                    case="capitalize"
                    intent="neutral"
                    priority="secondary"
                    typographyStyle={mapSizeToTypographyStyle(size)}
                >
                    {label}
                </Text>
            )}

            <Options>
                <Box margin={4} position={{ type: 'relative' }}>
                    <Puck
                        $optionsCount={options.length}
                        $selectedIndex={selectedIndex}
                        $orientation={isVertical ? 'vertical' : orientation}
                        tabIndex={0}
                        onKeyDown={handleKeyboardNav}
                    />
                    <Grid columns={isVertical ? 1 : options.length} gap={GAP} forceEqualColumns>
                        {options.map(option => {
                            const isSelected =
                                selectedOptionIn !== undefined
                                    ? selectedOptionIn === option.value
                                    : false;
                            const textIntent = mapStateToTextIntent(isSelected);

                            return (
                                <Text
                                    key={String(option.value)}
                                    intent={textIntent.intent}
                                    priority={textIntent.priority}
                                    isDisabled={isDisabled}
                                    typographyStyle={mapSizeToTypographyStyle(size, isSelected)}
                                    textWrap="nowrap"
                                    as="div"
                                    cursor={isDisabled ? 'not-allowed' : 'pointer'}
                                    minWidth={0}
                                    overflow="hidden"
                                >
                                    <Option
                                        onClick={handleOptionClick(option)}
                                        $isDisabled={!!isDisabled}
                                        $isSelected={isSelected}
                                        data-isdisabled={!!isDisabled}
                                        data-testid={`${dataTest ?? 'select-bar'}/${String(option.value)}`}
                                    >
                                        <Column
                                            padding={mapSizeToPadding(size)}
                                            alignItems="stretch"
                                            width="100%"
                                            minWidth={0}
                                        >
                                            <Text
                                                as="div"
                                                align="center"
                                                width="100%"
                                                maxWidth="100%"
                                                minWidth={0}
                                                ellipsisLineCount={1}
                                            >
                                                {option.label}
                                            </Text>
                                            <Box height={0} overflow="hidden" aria-hidden>
                                                <Text typographyStyle="body-md-strong">
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
