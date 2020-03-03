import colors from '../../../config/colors';
import { FONT_SIZE } from '../../../config/variables';
import React from 'react';
import styled, { css } from 'styled-components';

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
            border: 1px solid ${colors.BLACK50};
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
    box-shadow: ${props => (!props.isChecked ? `inset 0 3px 6px 0 ${colors.BLACK92}` : `none`)};
    background: ${props => (props.isChecked ? colors.GREEN : colors.WHITE)};
    border: 1px solid ${props => (props.isChecked ? colors.GREENER : colors.BLACK80)};

    &:hover,
    &:focus {
        ${props =>
            !props.isChecked &&
            css`
                border: 1px solid ${colors.BLACK50};
            `}
    }
`;

const Label = styled.div<IconWrapperProps>`
    display: flex;
    padding-left: 10px;
    padding-top: 2px;
    justify-content: center;
    color: ${colors.BLACK0};
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

const Checkbox = ({ isChecked, children, onClick, ...rest }: Props) => (
    <Wrapper
        onClick={onClick}
        onKeyUp={event => handleKeyboard(event, onClick)}
        tabIndex={0}
        {...rest}
    >
        <IconWrapper isChecked={isChecked}>
            {isChecked && <Icon size={10} color={colors.WHITE} icon="CHECK" />}
        </IconWrapper>
        <Label isChecked={isChecked}>{children}</Label>
    </Wrapper>
);

export { Checkbox, Props as CheckboxProps };
