import { KeyboardEvent, ReactNode, useCallback, useEffect, useState } from 'react';

import styled, { css } from 'styled-components';

import { breakpointMediaQueries } from '@trezor/styles';
import {
    Elevation,
    borders,
    mapElevationToBackground,
    nextElevation,
    spacings,
    spacingsPx,
    typography,
} from '@trezor/theme';

import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../../utils/frameProps';
import { TransientProps } from '../../../utils/transientProps';
import { focusStyleTransition, getFocusShadowStyle } from '../../../utils/utils';
import { useElevation } from '../../ElevationContext/ElevationContext';

export const allowedSelectBarFrameProps = ['margin', 'width'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedSelectBarFrameProps)[number]>;

export const orientations = ['horizontal', 'vertical', 'auto'] as const;
export type Orientation = (typeof orientations)[number];

export const DEFAULT_ORIENTATION = 'auto';

const getTranslateValue = (index: number) => {
    const value = index * 100;

    if (!index) {
        return;
    }

    return `calc(${value}% + ${index * spacings.xxs}px)`;
};

const getPuckWidth = (optionsCount: number) =>
    `calc((100% - 8px - ${(optionsCount - 1) * spacings.xxs}px) / ${optionsCount})`;

const columnWrapper = css`
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
`;
const columnOption = css`
    grid-auto-flow: row;
    width: 100%;
    border-radius: ${borders.radii.lg};
`;
const columnPuck = ({
    $selectedIndex: selectedIndex,
    $optionsCount,
}: {
    $optionsCount: number;
    $selectedIndex: number;
}) => css`
    left: 4px;
    right: 4px;
    top: 4px;
    width: auto;
    height: ${getPuckWidth($optionsCount)};
    transform: ${`translateY(${getTranslateValue(selectedIndex)})`};
`;

const Wrapper = styled.div<
    TransientProps<AllowedFrameProps> & { $isFullWidth?: boolean; $orientation: Orientation }
>`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.sm};
    width: ${({ $isFullWidth }) => ($isFullWidth ? '100%' : 'auto')};

    ${({ $orientation }) =>
        $orientation === 'auto' &&
        css`
            ${breakpointMediaQueries.below_sm} {
                ${columnWrapper}
            }
        `}

    ${({ $orientation }) => $orientation === 'vertical' && columnWrapper}


    ${withFrameProps}
`;

const Label = styled.span`
    color: ${({ theme }) => theme.textSubdued};
    text-transform: capitalize;
`;

const Options = styled.div<{
    $optionsCount: number;
    $isFullWidth?: boolean;
    $elevation: Elevation;
    $orientation: Orientation;
}>`
    position: relative;
    display: grid;
    grid-auto-columns: ${({ $optionsCount }) => `minmax(${getPuckWidth($optionsCount)}, 1fr)`};
    grid-auto-flow: column;
    gap: ${spacingsPx.xxs};
    padding: ${spacingsPx.xxs};
    background: ${mapElevationToBackground};
    border-radius: ${borders.radii.full};
    width: ${({ $isFullWidth }) => ($isFullWidth ? '100%' : 'auto')};

    ${({ $orientation }) =>
        $orientation === 'auto' &&
        css`
            ${breakpointMediaQueries.below_sm} {
                ${columnOption}
            }
        `}

    ${({ $orientation }) => $orientation === 'vertical' && columnOption}
`;

const Puck = styled.div<{
    $optionsCount: number;
    $selectedIndex: number;
    $elevation: Elevation;
    $orientation: Orientation;
}>`
    position: absolute;
    left: 4px;
    top: 4px;
    bottom: 4px;
    width: ${({ $optionsCount }) => getPuckWidth($optionsCount)};
    padding: ${spacingsPx.xxs} ${spacingsPx.xl};
    background: ${mapElevationToBackground};
    border-radius: ${borders.radii.full};
    box-shadow: ${({ theme, $elevation }) => $elevation === 1 && theme.boxShadowBase};
    transform: ${({ $selectedIndex }) => `translateX(${getTranslateValue($selectedIndex)})`};
    transition:
        transform 0.175s cubic-bezier(1, 0.02, 0.38, 0.74),
        ${focusStyleTransition};

    ${getFocusShadowStyle()}

    ${({ $orientation, $optionsCount, $selectedIndex }) =>
        $orientation === 'auto' &&
        css`
            ${breakpointMediaQueries.below_sm} {
                ${columnPuck({ $optionsCount, $selectedIndex })}
            }
        `}

    ${({ $orientation }) => $orientation === 'vertical' && columnPuck}
`;

const WidthMock = styled.span`
    height: 0;
    visibility: hidden;
    ${typography.highlight}
`;

const Option = styled.div<{ $isSelected: boolean; $isDisabled: boolean }>`
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    height: 36px;
    padding: ${spacingsPx.xxs} ${spacingsPx.xl};
    color: ${({ theme }) => theme.textSubdued};
    ${typography.body}
    text-transform: capitalize;
    white-space: nowrap;
    transition: color 0.175s;
    cursor: pointer;

    &:hover {
        color: ${({ theme, $isSelected, $isDisabled }) =>
            !$isSelected && !$isDisabled && theme.textDefault};
    }

    ${({ $isSelected }) =>
        $isSelected &&
        css`
            color: ${({ theme }) => theme.textPrimaryDefault};
            ${typography.highlight}
        `}

    ${({ $isDisabled }) =>
        $isDisabled &&
        css`
            color: ${({ theme }) => theme.textDisabled};
            pointer-events: auto;
            cursor: not-allowed;
        `}
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
    orientation?: 'horizontal' | 'vertical' | 'auto';
    className?: string;
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
    orientation = DEFAULT_ORIENTATION,
    className,
    'data-testid': dataTest,
    ...rest
}: SelectBarProps<V>) => {
    const [selectedOptionIn, setSelected] = useState<ValueTypes | undefined>(selectedOption);
    const { elevation } = useElevation();
    const frameProps = pickAndPrepareFrameProps(rest, allowedSelectBarFrameProps);

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

    return (
        <Wrapper
            className={className}
            $isFullWidth={isFullWidth}
            data-testid={dataTest}
            $orientation={orientation}
            {...frameProps}
        >
            {label && <Label>{label}</Label>}

            <Options
                $optionsCount={options.length}
                $isFullWidth={isFullWidth}
                $elevation={elevation}
                $orientation={orientation}
            >
                <Puck
                    $optionsCount={options.length}
                    $selectedIndex={selectedIndex}
                    $elevation={nextElevation[elevation]}
                    $orientation={orientation}
                    tabIndex={0}
                    onKeyDown={handleKeyboardNav}
                />

                {options.map(option => (
                    <Option
                        key={String(option.value)}
                        onClick={handleOptionClick(option)}
                        $isDisabled={!!isDisabled}
                        $isSelected={
                            selectedOptionIn !== undefined
                                ? selectedOptionIn === option.value
                                : false
                        }
                        data-testid={`select-bar/${String(option.value)}`}
                    >
                        <span>{option.label}</span>
                        <WidthMock>{option.label}</WidthMock>
                    </Option>
                ))}
            </Options>
        </Wrapper>
    );
};
