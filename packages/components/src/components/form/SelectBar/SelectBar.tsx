import { useState, useEffect, ReactNode, useCallback } from 'react';
import styled, { css } from 'styled-components';
import { breakpointMediaQueries } from '@trezor/styles';
import { borders, boxShadows, spacings, spacingsPx, typography } from '@trezor/theme';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.sm};

    ${breakpointMediaQueries.below_sm} {
        flex-direction: column;
        align-items: flex-start;
        width: 100%;
    }
`;

const Label = styled.span`
    color: ${({ theme }) => theme.textSubdued};
    text-transform: capitalize;
`;

const getTranslateValue = (index: number) => {
    const value = index * 100;

    if (!index) {
        return;
    }

    return `calc(${value}% + ${index * spacings.xxs}px)`;
};

const getPuckWidth = (optionsCount: number) =>
    `calc((100% - 8px - ${(optionsCount - 1) * spacings.xxs}px) / ${optionsCount})`;

const Options = styled.div<{ optionsCount: number; selectedIndex: number }>`
    position: relative;
    display: grid;
    grid-auto-columns: ${({ optionsCount }) => `minmax(${getPuckWidth(optionsCount)}, 1fr)`};
    grid-auto-flow: column;
    gap: ${spacingsPx.xxs};
    padding: ${spacingsPx.xxs};
    background: ${({ theme }) => theme.backgroundSurfaceElevation0};
    border-radius: ${borders.radii.full};

    ::before {
        content: '';
        position: absolute;
        left: 4px;
        top: 4px;
        bottom: 4px;
        width: ${({ optionsCount }) => getPuckWidth(optionsCount)};
        padding: ${spacingsPx.xxs} ${spacingsPx.xl};
        background: ${({ theme }) => theme.backgroundSurfaceElevation1};
        border-radius: ${borders.radii.full};
        box-shadow: ${boxShadows.elevation1};
        transform: ${({ selectedIndex }) => `translateX(${getTranslateValue(selectedIndex)})`};
        transition: transform 0.175s cubic-bezier(1, 0.02, 0.38, 0.74);

        ${breakpointMediaQueries.below_sm} {
            left: 4px;
            right: 4px;
            top: 4px;
            width: auto;
            height: ${({ optionsCount }) => getPuckWidth(optionsCount)};
            transform: ${({ selectedIndex }) => `translateY(${getTranslateValue(selectedIndex)})`};
        }
    }

    ${breakpointMediaQueries.below_sm} {
        grid-auto-flow: row;
        width: 100%;
        border-radius: ${borders.radii.lg};
    }
`;

const WidthMock = styled.span`
    height: 0;
    visibility: hidden;
    ${typography.highlight}
`;

const Option = styled.div<{ isSelected: boolean; isDisabled: boolean }>`
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

    :hover {
        color: ${({ theme, isSelected, isDisabled }) =>
            !isSelected && !isDisabled && theme.textDefault};
    }

    ${({ isSelected }) =>
        isSelected &&
        css`
            color: ${({ theme }) => theme.textPrimaryDefault};
            ${typography.highlight}
        `}

    ${({ isDisabled }) =>
        isDisabled &&
        css`
            color: ${({ theme }) => theme.textDisabled};
            pointer-events: none;
        `}
`;

type ValueTypes = number | string | boolean;

interface Option<V extends ValueTypes> {
    label: ReactNode;
    value: V;
}

export interface SelectBarProps<V extends ValueTypes> {
    label?: ReactNode;
    options: Option<V>[];
    selectedOption?: V;
    onChange?: (value: V) => void;
    isDisabled?: boolean;
    className?: string;
}

// Generic type V is determined by selectedOption/options values
export const SelectBar: <V extends ValueTypes>(props: SelectBarProps<V>) => JSX.Element = ({
    label,
    options,
    selectedOption,
    onChange,
    isDisabled,
    className,
    ...rest
}) => {
    const [selectedOptionIn, setSelected] = useState<ValueTypes | undefined>(selectedOption);

    useEffect(() => {
        if (selectedOption !== undefined) {
            setSelected(selectedOption);
        }
    }, [selectedOption, setSelected]);

    const handleOptionClick = useCallback(
        (option: Option<ValueTypes>) => () => {
            if (option.value === selectedOptionIn) {
                return;
            }

            setSelected(option.value);

            onChange?.(option?.value as any);
        },
        [selectedOptionIn, onChange],
    );

    const selectedIndex = options.findIndex(option => option.value === selectedOptionIn);

    return (
        <Wrapper className={className} {...rest}>
            {label && <Label>{label}</Label>}

            <Options optionsCount={options.length} selectedIndex={selectedIndex}>
                {options.map(option => (
                    <Option
                        key={String(option.value)}
                        onClick={handleOptionClick(option)}
                        isDisabled={!!isDisabled}
                        isSelected={
                            selectedOptionIn !== undefined
                                ? selectedOptionIn === option.value
                                : false
                        }
                        data-test={`select-bar/${String(option.value)}`}
                    >
                        <span>{option.label}</span>
                        <WidthMock>{option.label}</WidthMock>
                    </Option>
                ))}
            </Options>
        </Wrapper>
    );
};
