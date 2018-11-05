/* @flow */

import * as React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import Icon from 'components/Icon';
import colors from 'config/colors';
import { getPrimaryColor, getSecondaryColor } from 'utils/notification';
import Loader from 'components/Loader';
import { TRANSITION } from 'config/variables';

type Props = {
    type: string;
    icon?: {
        type: Array<string>;
        color: string;
        size: number;
    };
    onClick: () => void;
    isLoading?: boolean;
    children: React.Node;
};

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
    background: ${props => getSecondaryColor(props.type)};
`;

const Wrapper = styled.button`
    padding: 12px 58px;
    border-radius: 3px;
    background: transparent;
    font-size: 14px;
    position: relative;
    font-weight: 300;
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
}: Props) => (
    <Wrapper
        icon={icon}
        onClick={onClick}
        type={type}
    >
        {isLoading && (
            <LoaderContent type={type}>
                <Loader size={30} />
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