import React, { useState, useEffect, ReactNode } from 'react';
import styled, { css } from 'styled-components';
import { variables } from '../../../config';

const Wrapper = styled.div`
    display: flex;
    height: 32px;
`;

const Label = styled.div`
    padding-right: 20px;
    display: flex;
    align-items: center;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    text-transform: capitalize;
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

const Options = styled.div`
    display: flex;
    flex: 1;
    padding: 0 2px;
    border-radius: 4px;
    background: ${props => props.theme.BG_GREY};
`;

const Option = styled.div<{ isSelected: boolean }>`
    padding: 0 14px;
    margin: 2px 0;
    padding-top: 1px;
    display: flex;
    align-items: center;
    flex: 1;
    border-radius: 4px;
    font-size: ${variables.FONT_SIZE.SMALL};
    text-transform: capitalize;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    cursor: pointer;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};

    ${props =>
        props.isSelected &&
        css`
            background: ${props => props.theme.BG_WHITE};
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);
            color: ${props => props.theme.TYPE_DARK_GREY};
            font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
        `}
`;

interface Option<V> {
    label: ReactNode;
    value: V;
}

interface Props<V> {
    label?: ReactNode;
    selectedOption?: V;
    options: Option<V>[];
    className?: string;
    isDisabled?: boolean;
    onChange?: (value: V) => void;
}

// Generic type V is determined by selectedOption/options values
const SelectBar: <V extends string>(props: Props<V>) => JSX.Element = ({
    options,
    selectedOption,
    label,
    onChange,
    className,
    isDisabled,
}) => {
    const [selectedOptionIn, setSelected] = useState<typeof selectedOption>(selectedOption);

    useEffect(() => {
        if (selectedOption) {
            setSelected(selectedOption);
        }
    }, [selectedOption, setSelected]);

    return (
        <Wrapper className={className}>
            {label && <Label>{label}</Label>}
            <Options>
                {options.map(option => (
                    <Option
                        onClick={() => {
                            if (isDisabled) return;
                            setSelected(option.value);
                            if (onChange) {
                                onChange(option.value);
                            }
                        }}
                        isSelected={selectedOptionIn ? selectedOptionIn === option.value : false}
                        key={option.value}
                        data-test={`select-bar/${option.value}`}
                    >
                        {option.label}
                    </Option>
                ))}
            </Options>
        </Wrapper>
    );
};

export { SelectBar, Props as SelectBarProps };
