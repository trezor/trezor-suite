import React from 'react';
import styled, { css } from 'styled-components';
import PropTypes from 'prop-types';
import { TRANSITION } from 'config/variables';
import colors from 'config/colors';

const A = styled.a`
    text-decoration: none;
    cursor: pointer;
    transition: ${TRANSITION.HOVER};

    ${props => props.isGreen && css`
        border-bottom: 1px solid ${colors.GREEN_PRIMARY};
    `}
    ${props => props.isGray && css`
        border-bottom: 1px solid ${colors.TEXT_SECONDARY};
    `}

    &,
    &:visited {
        ${props => props.isGreen && css`
            color: ${colors.GREEN_PRIMARY};
        `}
        ${props => props.isGray && css`
            color: ${colors.TEXT_SECONDARY};
        `}
    }

    &:hover {
        border-color: transparent;
        ${props => props.isGreen && css`
            color: ${colors.GREEN_SECONDARY};
        `}
        ${props => props.isGray && css`
            color: ${colors.TEXT_PRIMARY};
        `}
    }

    &:active {
        ${props => props.isGreen && css`
            color: ${colors.GREEN_TERTIARY};
        `}
        ${props => props.isGray && css`
            color: ${colors.TEXT_PRIMARY};
        `}
    }
`;

const Link = ({
    text, href, target, rel, isGreen = false, isGray = false,
}) => (
    <A
        href={href}
        target={target}
        rel={rel}
        isGreen={isGreen}
        isGray={isGray}
    >{text}
    </A>
);

Link.propTypes = {
    text: PropTypes.string.isRequired,
    href: PropTypes.string.isRequired,
    target: PropTypes.string,
    rel: PropTypes.string,
    isGreen: PropTypes.bool,
    isGray: PropTypes.bool,
};

export default Link;
