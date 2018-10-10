/* @flow */

import * as React from 'react';
import styled, { css } from 'styled-components';
import PropTypes from 'prop-types';
import Icon from 'components/Icon';
import colors from 'config/colors';
import { TRANSITION } from 'config/variables';

type Props = {
    type: string;
    icon?: {
        type: Array<string>;
        color: string;
        size: number;
    };
    onClick: () => void;
    children: React.Node;
};

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
    type, icon, onClick, children,
}: Props) => (
    <Wrapper
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
    type: PropTypes.string.isRequired,
    icon: PropTypes.shape({
        type: PropTypes.arrayOf(PropTypes.string).isRequired,
        color: PropTypes.string,
        size: PropTypes.number,
    }),
    onClick: PropTypes.func,
    children: PropTypes.node.isRequired,
};

export default NotificationButton;