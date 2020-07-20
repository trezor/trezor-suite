import React, { useState } from 'react';
import styled, { css } from 'styled-components';
import { colors, variables } from '../../../config';

interface Option {
    label: string;
    value: string;
}

interface Props {
    label?: React.ReactNode;
    selectedOption?: Option['value'];
    options: Option[];
    onChange?: (value: any) => void;
}

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
    color: ${colors.NEUE_TYPE_DARK_GREY};
`;

const Options = styled.div`
    display: flex;
    flex: 1;
    padding: 0 2px;
    border-radius: 4px;
    background: ${colors.NEUE_BG_GRAY};
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
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    cursor: pointer;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};

    ${props =>
        props.isSelected &&
        css`
            background: white;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);
            color: ${colors.NEUE_TYPE_DARK_GREY};
            font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
        `}
`;

export default ({ options, selectedOption, label, onChange }: Props) => {
    const [selectedOptionIn, setSelected] = useState<Option['value'] | null>(
        selectedOption || null
    );

    return (
        <Wrapper>
            {label && <Label>{label}</Label>}
            <Options>
                {options.map(option => (
                    <Option
                        onClick={() => {
                            setSelected(option.value);
                            if (onChange) {
                                onChange(option.value);
                            }
                        }}
                        isSelected={selectedOptionIn ? selectedOptionIn === option.value : false}
                        key={option.value}
                    >
                        {option.label}
                    </Option>
                ))}
            </Options>
        </Wrapper>
    );
};
