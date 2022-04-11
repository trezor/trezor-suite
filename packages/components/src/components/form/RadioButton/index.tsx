import React from 'react';
import styled from 'styled-components';
import { FONT_SIZE, FONT_WEIGHT } from '../../../config/variables';
import { KEYBOARD_CODE } from '../../../constants/keyboardEvents';

const Wrapper = styled.div`
    display: flex;
    cursor: pointer;
    align-items: flex-start;

    :hover,
    :focus {
        outline: none;
    }
`;

const RadioIcon = styled.div<Pick<RadioButtonProps, 'isChecked'>>`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 26px;
    height: 26px;
    max-width: 26px;
    min-width: 26px;
    border-radius: 50%;
    position: relative;
    border: 2px solid
        ${({ theme, isChecked }) => (isChecked ? theme.TYPE_GREEN : theme.STROKE_GREY)};

    :after {
        display: ${({ isChecked }) => (isChecked ? 'block' : 'none')};
        content: '';
        position: absolute;
        top: 4px;
        left: 4px;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: ${({ theme }) => theme.BG_GREEN};
    }
`;

const Label = styled.div`
    display: flex;
    padding-left: 17px;
    padding-top: 2px;
    justify-content: left;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-weight: ${FONT_WEIGHT.MEDIUM};
    font-size: ${FONT_SIZE.SMALL};
    line-height: 22px;
`;

interface RadioButtonProps extends React.HTMLAttributes<HTMLDivElement> {
    onClick: (
        event: React.KeyboardEvent<HTMLElement> | React.MouseEvent<HTMLElement> | null,
    ) => any;
    isChecked?: boolean;
}

const handleKeyboard = (
    event: React.KeyboardEvent<HTMLElement>,
    onClick: RadioButtonProps['onClick'],
) => {
    if (event.code === KEYBOARD_CODE.SPACE) {
        onClick(event);
    }
};

export const RadioButton = ({ isChecked, children, onClick, ...rest }: RadioButtonProps) => (
    <Wrapper
        onClick={onClick}
        onKeyUp={event => handleKeyboard(event, onClick)}
        tabIndex={0}
        data-checked={isChecked}
        {...rest}
    >
        <RadioIcon isChecked={isChecked} />
        <Label>{children}</Label>
    </Wrapper>
);
