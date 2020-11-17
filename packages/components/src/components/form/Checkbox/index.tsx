import React from 'react';
import styled, { css } from 'styled-components';
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

    &:hover {
        > div:first-child {
            border: 1px solid ${props => props.theme.TYPE_DARK_GREY};
        }
    }
`;

const IconWrapper = styled.div<IconWrapperProps>`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 19px;
    min-width: 19px;
    max-width: 19px;
    height: 19px;
    border-radius: 3px;
    box-shadow: ${props =>
        !props.isChecked ? `inset 0 3px 6px 0 ${props.theme.BG_GREY}` : `none`};
    background: ${props => (props.isChecked ? props.theme.BG_GREEN : props.theme.BG_WHITE)};
    border: 1px solid
        ${props => (props.isChecked ? props.theme.TYPE_GREEN : props.theme.TYPE_LIGHT_GREY)};

    &:hover,
    &:focus {
        ${props =>
            !props.isChecked &&
            css`
                border: 1px solid ${props.theme.TYPE_DARK_GREY};
            `}
    }
`;

const Label = styled.div<IconWrapperProps>`
    display: flex;
    padding-left: 10px;
    padding-top: 2px;
    justify-content: center;
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-size: ${FONT_SIZE.SMALL};
    line-height: 18px;
`;

interface Props extends React.HTMLAttributes<HTMLDivElement> {
    onClick: (
        event: React.KeyboardEvent<HTMLElement> | React.MouseEvent<HTMLElement> | null
    ) => any;
    isChecked?: boolean;
}

type IconWrapperProps = Omit<Props, 'onClick'>;

const handleKeyboard = (event: React.KeyboardEvent<HTMLElement>, onClick: Props['onClick']) => {
    if (event.keyCode === 32) {
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
                {isChecked && <Icon size={16} color={theme.TYPE_WHITE} icon="CHECK" />}
            </IconWrapper>
            <Label isChecked={isChecked}>{children}</Label>
        </Wrapper>
    );
};

export { Checkbox, Props as CheckboxProps };
