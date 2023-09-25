import { useState, useEffect, ReactNode, useCallback } from 'react';
import styled, { css } from 'styled-components';
import { borders } from '@trezor/theme';
import { SCREEN_SIZE, FONT_SIZE, FONT_WEIGHT } from '../../../config/variables';
import { Label, LabelLeft } from '../InputStyles';

const Wrapper = styled.div<{ isInLine: boolean }>`
    display: flex;
    height: 40px;

    @media (max-width: ${SCREEN_SIZE.SM}) {
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

const Options = styled.div<{ isInLine: boolean }>`
    display: flex;
    flex: ${({ isInLine }) => isInLine && '1'};
    padding: 0 4px;
    border-radius: ${borders.radii.sm};
    background: ${({ theme }) => theme.BG_GREY};

    @media (max-width: ${SCREEN_SIZE.SM}) {
        flex-direction: column;
        width: 100%;
    }

    @media (min-width: ${SCREEN_SIZE.SM}) {
        height: ${({ isInLine }) => !isInLine && '48px'};
    }
`;

const Option = styled.div<{ isSelected: boolean }>`
    display: flex;
    flex: 1;
    justify-content: center;
    align-items: center;
    margin: 4px 0;
    padding: 0 14px;
    padding-top: 1px;
    border-radius: 8px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${FONT_SIZE.SMALL};
    text-transform: capitalize;
    white-space: nowrap;
    font-weight: ${FONT_WEIGHT.DEMI_BOLD};
    cursor: pointer;

    ${({ isSelected }) =>
        isSelected &&
        css`
            background: ${({ theme }) => theme.BG_WHITE};
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);
            color: ${({ theme }) => theme.TYPE_DARK_GREY};
            font-weight: ${FONT_WEIGHT.DEMI_BOLD};
        `}

    @media (max-width: ${SCREEN_SIZE.SM}) {
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

export interface SelectBarProps<V extends ValueTypes> {
    label?: ReactNode;
    options: Option<V>[];
    selectedOption?: V;
    onChange?: (value: V) => void;
    isInLine?: boolean;
    isDisabled?: boolean;
    className?: string;
}

// Generic type V is determined by selectedOption/options values
export const SelectBar: <V extends ValueTypes>(props: SelectBarProps<V>) => JSX.Element = ({
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
            {label && (
                <Label>
                    <LabelLeft>{label}</LabelLeft>
                </Label>
            )}

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
                        data-test={`select-bar/${String(option.value)}`}
                    >
                        {option.label}
                    </Option>
                ))}
            </Options>
        </Wrapper>
    );
};
