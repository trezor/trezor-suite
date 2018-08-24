import React from 'react';
import styled, { css } from 'styled-components';
import PropTypes from 'prop-types';
import Icon from 'components/Icon';
import colors from 'config/colors';

const Wrapper = styled.button`
    padding: ${props => (props.icon ? '4px 24px 4px 15px' : '11px 24px')};
    border-radius: 3px;
    font-size: 14px;
    font-weight: 300;
    cursor: pointer;
    background: ${colors.GREEN_PRIMARY};
    color: ${colors.WHITE};
    border: 0;
    &:hover {
        background: ${colors.GREEN_SECONDARY};
    }
    &:active {
        background: ${colors.GREEN_TERTIARY};
    }
    ${props => props.disabled && css`
        pointer-events: none;
        color: ${colors.TEXT_SECONDARY};
        background: ${colors.GRAY_LIGHT};
    `}
`;

const IconWrapper = styled.span`
    margin-right: 8px;
`;

const Button = ({
    text, icon, onClick, disabled, blue, white,
}) => (
    <Wrapper
        icon={icon}
        onClick={onClick}
        disabled={disabled}
        blue={blue}
        white={white}
    >
        {icon && (
            <IconWrapper>
                <Icon
                    icon={icon.type}
                    color={icon.color}
                    size={icon.size}
                />
            </IconWrapper>
        )}
        {text}
    </Wrapper>
);

Button.propTypes = {
    onClick: PropTypes.func,
    disabled: PropTypes.bool,
    blue: PropTypes.bool,
    white: PropTypes.bool,
    icon: PropTypes.shape({
        type: PropTypes.arrayOf(PropTypes.string).isRequired,
        color: PropTypes.string,
        size: PropTypes.number,
    }),
    text: PropTypes.string.isRequired,
};

Button.defaultProps = {
    onClick: () => {},
    disabled: false,
    blue: false,
    white: false,
};

export default Button;