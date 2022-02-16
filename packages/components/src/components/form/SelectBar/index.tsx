import React, { useState, useEffect, ReactNode, useCallback } from 'react';
import styled, { css } from 'styled-components';
import { variables } from '../../../config';

const Wrapper = styled.div<{ isInLine: boolean }>`
    display: flex;
    height: 32px;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        height: auto;
        width: 100%;
    }

    ${({ isInLine }) =>
        !isInLine &&
        css`
            width: 100%;
            height: auto;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
        `};
`;

const Label = styled.div<{ isInLine: boolean }>`
    display: flex;
    align-items: ${({ isInLine }) => isInLine && 'center'};
    min-height: ${({ isInLine }) => !isInLine && '32px'};
    padding-right: 20px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    text-transform: capitalize;
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
`;

const Options = styled.div<{ isInLine: boolean }>`
    display: flex;
    flex: ${({ isInLine }) => isInLine && '1'};
    padding: 0 2px;
    border-radius: 4px;
    background: ${({ theme }) => theme.BG_GREY};

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        flex-direction: column;
        width: 100%;
    }

    @media (min-width: ${variables.SCREEN_SIZE.SM}) {
        height: ${({ isInLine }) => !isInLine && '48px'};
    }
`;

const Option = styled.div<{ isSelected: boolean; isInLine: boolean }>`
    display: flex;
    flex: 1;
    justify-content: ${({ isInLine }) => !isInLine && 'center'};
    align-items: center;
    margin: 2px 0;
    padding: 0 14px;
    padding-top: 1px;
    border-radius: 4px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    text-transform: capitalize;
    white-space: nowrap;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    cursor: pointer;

    ${({ isSelected }) =>
        isSelected &&
        css`
            background: ${({ theme }) => theme.BG_WHITE};
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);
            color: ${({ theme }) => theme.TYPE_DARK_GREY};
            font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
        `}

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        flex: auto;
        justify-content: center;
        width: 100%;
        height: 40px;
    }
`;

type ValueTypes = number | string | boolean;

interface Option<V extends ValueTypes> {
    label: ReactNode;
    value: V;
}

interface SelectBarProps<V extends ValueTypes> {
    label?: ReactNode;
    options: Option<V>[];
    selectedOption?: V;
    onChange?: (value: V) => void;
    isInLine?: boolean;
    isDisabled?: boolean;
    className?: string;
}

// Generic type V is determined by selectedOption/options values
const SelectBar: <V extends ValueTypes>(props: SelectBarProps<V>) => JSX.Element = ({
    label,
    options,
    selectedOption,
    onChange,
    isInLine = true,
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
            if (isDisabled || option.value === selectedOptionIn) {
                return;
            }

            setSelected(option.value);

            onChange?.(option?.value as any);
        },
        [isDisabled, selectedOptionIn, onChange],
    );

    return (
        <Wrapper className={className} isInLine={isInLine} {...rest}>
            {label && <Label isInLine={isInLine}>{label}</Label>}

            <Options isInLine={isInLine}>
                {options.map(option => (
                    <Option
                        key={String(option.value)}
                        onClick={handleOptionClick(option)}
                        isSelected={
                            selectedOptionIn !== undefined
                                ? selectedOptionIn === option.value
                                : false
                        }
                        isInLine={isInLine}
                        data-test={`select-bar/${String(option.value)}`}
                    >
                        {option.label}
                    </Option>
                ))}
            </Options>
        </Wrapper>
    );
};

export type { SelectBarProps };
export { SelectBar };
