import React from 'react';
import styled, { css } from 'styled-components';

import { FONT_SIZE } from '../../config/variables';
import { Icon } from '../Icon';
import colors from '../../config/colors';

const Wrapper = styled.div`
    display: flex;
    flex-direction: row;
    cursor: pointer;
    align-items: center;

    &:hover,
    &:focus {
        outline: none;
    }
`;

const IconWrapper = styled.div<IconWrapperProps>`
    display: flex;
    border-radius: 2px;
    justify-content: center;
    align-items: center;
    color: ${props => (props.isChecked ? colors.WHITE : colors.GREEN_PRIMARY)};
    background: ${props => (props.isChecked ? colors.GREEN_PRIMARY : colors.WHITE)};
    border: 1px solid ${props => (props.isChecked ? colors.GREEN_PRIMARY : colors.DIVIDER)};
    width: 24px;
    height: 24px;

    &:hover,
    &:focus {
        ${props =>
            !props.isChecked &&
            css`
                border: 1px solid ${colors.GREEN_PRIMARY};
            `}
        background: ${props => (props.isChecked ? colors.GREEN_PRIMARY : colors.WHITE)};
    }
`;

const Label = styled.div<IconWrapperProps>`
    display: flex;
    padding-left: 10px;
    justify-content: center;
    ${colors.TEXT_SECONDARY};
    font-size: ${FONT_SIZE.BASE};

    &:hover,
    &:focus {
        color: ${props => (props.isChecked ? colors.TEXT_PRIMARY : colors.TEXT_PRIMARY)};
    }
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
            {isChecked && (
                <Icon
                    hoverColor={colors.WHITE}
                    size={10}
                    color={isChecked ? colors.WHITE : colors.GREEN_PRIMARY}
                    icon="SUCCESS"
                />
            )}
        </IconWrapper>
        <Label isChecked={isChecked}>{children}</Label>
    </Wrapper>
);

export { Checkbox, Props as CheckboxProps };
