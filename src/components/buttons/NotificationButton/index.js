import React from 'react';
import styled, { css } from 'styled-components';
import PropTypes from 'prop-types';
import Icon from 'components/Icon';
import colors from 'config/colors';
import { TRANSITION } from 'config/variables';

const Wrapper = styled.button`
    padding: 12px 58px;
    border-radius: 3px;
    background: transparent;
    font-size: 14px;
    font-weight: 300;
    cursor: pointer;
    color: ${colors.WHITE};
    border: 0;
    transition: ${TRANSITION.HOVER};

    ${props => props.type === 'info' && css`
        border: 1px solid ${colors.INFO_PRIMARY};
        color: ${colors.INFO_PRIMARY};

        &:hover {
            color: ${colors.WHITE};
            background: ${colors.INFO_PRIMARY};
        }
    `}

    ${props => props.type === 'success' && css`
        border: 1px solid ${colors.SUCCESS_PRIMARY};
        color: ${colors.SUCCESS_PRIMARY};

        &:hover {
            color: ${colors.WHITE};
            background: ${colors.SUCCESS_PRIMARY};
        }
    `}

    ${props => props.type === 'error' && css`
        border: 1px solid ${colors.ERROR_PRIMARY};
        color: ${colors.ERROR_PRIMARY};

        &:hover {
            color: ${colors.WHITE};
            background: ${colors.ERROR_PRIMARY};
        }
    `}

    ${props => props.type === 'warning' && css`
        border: 1px solid ${colors.WARNING_PRIMARY};
        color: ${colors.WARNING_PRIMARY};

        &:hover {
            color: ${colors.WHITE};
            background: ${colors.WARNING_PRIMARY};
        }
    `}
`;

const IconWrapper = styled.span`
    margin-right: 8px;
`;

const NotificationButton = ({
    children, className, icon, onClick = () => { }, type = null,
}) => (
    <Wrapper
        className={className}
        icon={icon}
        onClick={onClick}
        type={type}
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
        {children}
    </Wrapper>
);

NotificationButton.propTypes = {
    children: PropTypes.element.isRequired,
    type: PropTypes.string.isRequired,
    className: PropTypes.string,
    onClick: PropTypes.func,
    icon: PropTypes.shape({
        type: PropTypes.arrayOf(PropTypes.string).isRequired,
        color: PropTypes.string,
        size: PropTypes.number,
    }),
};

export default NotificationButton;