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

const Options = styled.div`
    display: grid;
    grid-auto-columns: 1fr;
    grid-auto-flow: column;
    gap: ${spacingsPx.xxs};
    padding: ${spacingsPx.xxs};
    background: ${({ theme }) => theme.backgroundSurfaceElevation0};
    border-radius: ${borders.radii.full};

    ${breakpointMediaQueries.below_sm} {
        grid-auto-flow: row;
        width: 100%;
        border-radius: ${borders.radii.lg};
    }
`;

const Option = styled.div<{ isSelected: boolean; isDisabled: boolean }>`
    display: flex;
    flex: 1;
    justify-content: center;
    align-items: center;
    padding: ${spacingsPx.xxs} ${spacingsPx.xl};
    border-radius: ${borders.radii.full};
    color: ${({ theme }) => theme.textSubdued};
    ${typography.body}
    text-transform: capitalize;
    white-space: nowrap;
    transition: color 0.1s;
    cursor: pointer;

    :hover {
        color: ${({ theme, isSelected, isDisabled }) =>
            !isSelected && !isDisabled && theme.textDefault};
    }

    ${({ isSelected }) =>
        isSelected &&
        css`
            padding: ${spacingsPx.xxs} ${spacings.xl - 1}px;
            background: ${({ theme }) => theme.backgroundSurfaceElevation1};
            box-shadow: ${boxShadows.elevation1};
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

    return (
        <Wrapper className={className} {...rest}>
            {label && <Label>{label}</Label>}

            <Options>
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
                        {option.label}
                    </Option>
                ))}
            </Options>
        </Wrapper>
    );
};
