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
    min-height: 20px;
`;

const Options = styled.div`
    display: flex;
    padding: 2px;
    border-radius: 4px;
    background: ${colors.NEUE_BG_GRAY};
`;

const Label = styled.div`
    padding-right: 20px;
    text-transform: capitalize;
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${colors.NEUE_TYPE_DARK_GREY};
`;

const Option = styled.div<{ isSelected: boolean }>`
    padding: 0 14px;
    border-radius: 4px;
    font-size: ${variables.FONT_SIZE.SMALL};
    text-transform: capitalize;
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    cursor: pointer;

    ${props =>
        props.isSelected &&
        css`
            background: white;
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
