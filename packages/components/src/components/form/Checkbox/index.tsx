import React from 'react';
import styled from 'styled-components';
import { darken } from 'polished';
import { KEYBOARD_CODE } from '../../../constants/keyboardEvents';
import { FONT_SIZE } from '../../../config/variables';
import { useTheme } from '../../../utils';
import { Icon } from '../../Icon';

const Wrapper = styled.div`
    display: flex;
    cursor: pointer;
    align-items: center;

    :hover,
    :focus {
        outline: none;
    }
`;

const IconWrapper = styled.div<Pick<CheckboxProps, 'isChecked'>>`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 24px;
    min-width: 24px;
    max-width: 24px;
    height: 24px;
    border-radius: 4px;
    background: ${({ theme, isChecked }) => (isChecked ? theme.BG_GREEN : theme.BG_WHITE)};
    border: 2px solid
        ${({ theme, isChecked }) => (isChecked ? theme.TYPE_GREEN : theme.STROKE_GREY)};

    :hover,
    :focus {
        border: ${({ theme, isChecked }) =>
            !isChecked && `2px solid ${darken(theme.HOVER_DARKEN_FILTER, theme.STROKE_GREY)}`};
    }
`;

const Label = styled.div`
    display: flex;
    padding-left: 12px;
    justify-content: center;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-size: ${FONT_SIZE.SMALL};
    line-height: 24px;
`;

const handleKeyboard = (
    event: React.KeyboardEvent<HTMLElement>,
    onClick: CheckboxProps['onClick'],
) => {
    if (event.code === KEYBOARD_CODE.SPACE) {
        onClick(event);
    }
};

export interface CheckboxProps extends React.HTMLAttributes<HTMLDivElement> {
    onClick: (
        event: React.KeyboardEvent<HTMLElement> | React.MouseEvent<HTMLElement> | null,
    ) => any;
    isChecked?: boolean;
}

export const Checkbox = ({ isChecked, children, onClick, ...rest }: CheckboxProps) => {
    const theme = useTheme();

    return (
        <Wrapper
            onClick={onClick}
            onKeyUp={event => handleKeyboard(event, onClick)}
            tabIndex={0}
            {...rest}
        >
            <IconWrapper isChecked={isChecked}>
                {isChecked && <Icon size={24} color={theme.TYPE_WHITE} icon="CHECK" />}
            </IconWrapper>

            <Label>{children}</Label>
        </Wrapper>
    );
};
