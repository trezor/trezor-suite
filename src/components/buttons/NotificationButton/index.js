import { FONT_SIZE, FONT_WEIGHT, TRANSITION } from 'config/variables';

import Icon from 'components/Icon';
import Loader from 'components/Loader';
import PropTypes from 'prop-types';
import React from 'react';
import { WHITE_COLOR } from 'config/animations';
import colors from 'config/colors';
import { getPrimaryColor } from 'utils/notification';
import styled from 'styled-components';

const LoaderContent = styled.div`
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    right: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: default;
    color: ${colors.WHITE};
    background: ${props => getPrimaryColor(props.type)};
`;

const Wrapper = styled.button`
    padding: 12px 58px;
    border-radius: 3px;
    background: transparent;
    font-size: ${FONT_SIZE.BASE};
    position: relative;
    font-weight: ${FONT_WEIGHT.LIGHT};
    cursor: pointer;
    color: ${props => getPrimaryColor(props.type)};
    border: 1px solid ${props => getPrimaryColor(props.type)};
    transition: ${TRANSITION.HOVER};

    &:hover {
        color: ${colors.WHITE};
        background: ${props => getPrimaryColor(props.type)};
    }
`;

const IconWrapper = styled.span`
    margin-right: 8px;
`;

const NotificationButton = ({
    type, icon, onClick, children, isLoading,
}) => (
    <Wrapper
        icon={icon}
        onClick={onClick}
        type={type}
    >
        {isLoading && (
            <LoaderContent type={type}>
                <Loader transparentRoute animationColor={WHITE_COLOR} size={30} />
            </LoaderContent>
        )}
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
    type: PropTypes.string.isRequired,
    icon: PropTypes.shape({
        type: PropTypes.arrayOf(PropTypes.string).isRequired,
        color: PropTypes.string,
        size: PropTypes.number,
    }),
    isLoading: PropTypes.bool,
    onClick: PropTypes.func,
    children: PropTypes.node.isRequired,
};

export default NotificationButton;