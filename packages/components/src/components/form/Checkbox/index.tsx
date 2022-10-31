import React from 'react';
import styled from 'styled-components';
import { darken } from 'polished';
import { KEYBOARD_CODE } from '../../../constants/keyboardEvents';
import { FONT_SIZE } from '../../../config/variables';
import { useTheme } from '../../../utils';
import { Icon } from '../../Icon';

const Wrapper = styled.div<Pick<CheckboxProps, 'isDisabled'>>`
    display: flex;
    cursor: ${({ isDisabled }) => (isDisabled ? 'default' : 'pointer')};
    align-items: center;

    :hover,
    :focus {
        outline: none;
    }
`;

const IconWrapper = styled.div<
    Pick<CheckboxProps, 'isChecked' | 'isDisabled'> & { $color?: string }
>`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 24px;
    min-width: 24px;
    max-width: 24px;
    height: 24px;
    border-radius: 4px;
    background: ${({ $color, isChecked, theme }) =>
        isChecked ? $color || theme.BG_GREEN : theme.BG_WHITE};
    border: 2px solid
        ${({ $color, isChecked, theme }) =>
            isChecked ? $color || theme.BG_GREEN : theme.STROKE_GREY};

    :hover,
    :focus {
        border: ${({ theme, isChecked, isDisabled }) =>
            !isChecked &&
            !isDisabled &&
            `2px solid ${darken(theme.HOVER_DARKEN_FILTER, theme.STROKE_GREY)}`};
    }
`;

const Label = styled.div`
    display: flex;
    justify-content: center;
    margin-left: 18px;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-size: ${FONT_SIZE.SMALL};
    line-height: 24px;
    text-align: left;
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
    color?: string;
    isChecked?: boolean;
    isDisabled?: boolean;
    onClick: (
        event: React.KeyboardEvent<HTMLElement> | React.MouseEvent<HTMLElement> | null,
    ) => any;
}

export const Checkbox = ({
    children,
    color,
    isChecked,
    isDisabled,
    onClick,
    ...rest
}: CheckboxProps) => {
    const theme = useTheme();

    const handleClick = isDisabled ? undefined : onClick;

    return (
        <Wrapper
            isDisabled={isDisabled}
            onClick={handleClick}
            onKeyUp={event => handleKeyboard(event, onClick)}
            tabIndex={0}
            {...rest}
        >
            <IconWrapper $color={color} isChecked={isChecked} isDisabled={isDisabled}>
                {isChecked && <Icon size={24} color={theme.TYPE_WHITE} icon="CHECK" />}
            </IconWrapper>

            <Label>{children}</Label>
        </Wrapper>
    );
};
