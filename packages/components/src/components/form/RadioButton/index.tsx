import React from 'react';
import styled from 'styled-components';
import { FONT_SIZE, FONT_WEIGHT } from '../../../config/variables';
import { KEYBOARD_CODE } from '../../../constants/keyboardEvents';
import { getInputColor } from '../../../utils/utils';

const Wrapper = styled.div<Pick<RadioButtonProps, 'disabled'>>`
    display: flex;
    cursor: ${({ disabled }) => (disabled ? 'default' : 'pointer')};
    align-items: flex-start;

    :hover,
    :focus {
        outline: none;
    }
`;

const RadioIcon = styled.div<Pick<RadioButtonProps, 'isChecked' | 'disabled'>>`
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
        ${({ disabled, isChecked, theme }) =>
            getInputColor(theme, { checked: isChecked, disabled })};

    :after {
        display: ${({ isChecked }) => (isChecked ? 'block' : 'none')};
        content: '';
        position: absolute;
        top: 4px;
        left: 4px;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: ${({ disabled, isChecked, theme }) =>
            getInputColor(theme, { checked: isChecked, disabled })};
    }
`;

const Label = styled.div`
    display: flex;
    padding-left: 12px;
    padding-top: 2px;
    justify-content: left;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${FONT_WEIGHT.MEDIUM};
    font-size: ${FONT_SIZE.SMALL};
    line-height: 22px;
`;

interface RadioButtonProps extends React.HTMLAttributes<HTMLDivElement> {
    onClick: (
        event: React.KeyboardEvent<HTMLElement> | React.MouseEvent<HTMLElement> | null,
    ) => any;
    isChecked?: boolean;
    disabled?: boolean;
}

export const RadioButton = ({
    isChecked,
    children,
    disabled,
    onClick,
    ...rest
}: RadioButtonProps) => {
    const handleClick: RadioButtonProps['onClick'] = event => {
        if (disabled) return;
        onClick(event);
    };
    const handleKeyUp = (event: React.KeyboardEvent<HTMLElement>) => {
        if (event.code === KEYBOARD_CODE.SPACE) {
            handleClick(event);
        }
    };

    return (
        <Wrapper
            onClick={handleClick}
            onKeyUp={handleKeyUp}
            tabIndex={0}
            disabled={disabled}
            data-checked={isChecked}
            {...rest}
        >
            <RadioIcon isChecked={isChecked} disabled={disabled} />
            {children && <Label>{children}</Label>}
        </Wrapper>
    );
};
