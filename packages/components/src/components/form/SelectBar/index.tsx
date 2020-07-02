import React, { useState } from 'react';
import styled, { css } from 'styled-components';
import { colors, variables } from '../../../config';

interface Option {
    label: string;
    value: string;
}

interface Props {
    label?: React.ReactNode;
    selectedOption?: Option;
    options: Option[];
}

const Wrapper = styled.div`
    display: flex;
    align-items: center;
`;

const Options = styled.div`
    display: flex;
    align-items: center;
    padding: 0 2px;
    border-radius: 4px;
    background: ${colors.NEUE_BG_GRAY};
`;

const Label = styled.div`
    padding-right: 20px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    text-transform: capitalize;
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${colors.NEUE_TYPE_DARK_GREY};
`;

const Option = styled.div<{ isSelected: boolean }>`
    padding: 0 14px;
    min-height: 25px;
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

export default ({ options, selectedOption, label }: Props) => {
    const [selectedOptionIn, setSelected] = useState<Option | null>(selectedOption || null);

    return (
        <Wrapper>
            {label && <Label>{label}</Label>}
            <Options>
                {options.map(option => (
                    <Option
                        onClick={() => setSelected(option)}
                        isSelected={
                            selectedOptionIn ? selectedOptionIn.value === option.value : false
                        }
                        key={option.value}
                    >
                        {option.label}
                    </Option>
                ))}
            </Options>
        </Wrapper>
    );
};
