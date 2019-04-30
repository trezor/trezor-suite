import Button from 'components/buttons/Button';
import PropTypes from 'prop-types';
import React from 'react';
import colors from 'config/colors';
import { getPrimaryColor } from 'utils/notification';
import styled from 'styled-components';

const StyledNotificationButton = styled(Button)`
    padding: 12px 36px;

    color: ${props => getPrimaryColor(props.type)};
    border: 1px solid ${props => getPrimaryColor(props.type)};

    &:hover,
    &:hover:focus {
        color: ${colors.WHITE};
        background: ${props => getPrimaryColor(props.type)};
    }
    :focus {
        /* focus outside of hover => default state */
        color: ${props => getPrimaryColor(props.type)};
        background: transparent;
    }
`;

const ButtonNotification = ({ type, icon, onClick, children, isLoading }) => (
    <StyledNotificationButton
        isInverse
        icon={icon}
        onClick={onClick}
        type={type}
        isLoading={isLoading}
    >
        {children}
    </StyledNotificationButton>
);

ButtonNotification.propTypes = {
    type: PropTypes.oneOf(['success', 'info', 'warning', 'error']).isRequired,
    icon: PropTypes.shape({
        type: PropTypes.arrayOf(PropTypes.string).isRequired,
        color: PropTypes.string,
        size: PropTypes.number,
    }),
    isLoading: PropTypes.bool,
    onClick: PropTypes.func,
    children: PropTypes.node.isRequired,
};

export default ButtonNotification;
