import React from 'react';
import styled, { css } from 'styled-components';
import { darken } from 'polished';
import { KEYBOARD_CODE } from '../../../constants/keyboardEvents';
import { FONT_SIZE } from '../../../config/variables';
import { useTheme } from '../../../utils';

import { Icon } from '../../Icon';

const Wrapper = styled.div`
    display: flex;
    cursor: pointer;
    align-items: center;

    &:hover,
    &:focus {
        outline: none;
    }
`;

const IconWrapper = styled.div<IconWrapperProps>`
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

    &:hover,
    &:focus {
        ${({ theme, isChecked }) =>
            !isChecked &&
            css`
                border: 2px solid ${darken(theme.HOVER_DARKEN_FILTER, theme.STROKE_GREY)};
            `}
    }
`;

const Label = styled.div<IconWrapperProps>`
    display: flex;
    padding-left: 12px;
    justify-content: center;
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-size: ${FONT_SIZE.SMALL};
    line-height: 24px;
`;

interface Props extends React.HTMLAttributes<HTMLDivElement> {
    onClick: (
        event: React.KeyboardEvent<HTMLElement> | React.MouseEvent<HTMLElement> | null
    ) => any;
    isChecked?: boolean;
}

type IconWrapperProps = Omit<Props, 'onClick'>;

const handleKeyboard = (event: React.KeyboardEvent<HTMLElement>, onClick: Props['onClick']) => {
    if (event.code === KEYBOARD_CODE.SPACE) {
        onClick(event);
    }
};

const Checkbox = ({ isChecked, children, onClick, ...rest }: Props) => {
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
            <Label isChecked={isChecked}>{children}</Label>
        </Wrapper>
    );
};

export { Checkbox, Props as CheckboxProps };
