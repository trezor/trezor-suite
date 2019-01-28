import React, { PureComponent } from 'react';
import styled, { css } from 'styled-components';
import PropTypes from 'prop-types';
import { FONT_SIZE, TRANSITION } from 'config/variables';
import colors from 'config/colors';
import { NavLink } from 'react-router-dom';

const A = styled.a`
    text-decoration: none;
    cursor: pointer;
    transition: ${TRANSITION.HOVER};
    font-size: ${FONT_SIZE.SMALL};

    ${props => props.isGreen && css`
        text-decoration: underline;
        text-decoration-color: ${colors.GREEN_PRIMARY};
    `}
    ${props => props.isGray && css`
        text-decoration: underline;
        text-decoration-color: ${colors.TEXT_SECONDARY};
    `}

    &,
    &:visited,
    &:active,
    &:hover {
        ${props => props.isGreen && css`
            color: ${colors.GREEN_PRIMARY};
        `}
        ${props => props.isGray && css`
            color: ${colors.TEXT_SECONDARY};
        `}
    }

    &:hover {
        border-color: transparent;
    }
`;

const StyledNavLink = styled(NavLink)`
    ${props => props.isGreen && css`
        color: ${colors.GREEN_PRIMARY};
    `}

    ${props => props.isGray && css`
        color: ${colors.TEXT_SECONDARY};
    `}
`;

class Link extends PureComponent {
    render() {
        const shouldRenderRouterLink = this.props.to;
        let LinkComponent;
        if (shouldRenderRouterLink) {
            LinkComponent = (
                <StyledNavLink {...this.props}>{this.props.children}</StyledNavLink>);
        } else {
            LinkComponent = (
                <A
                    href={this.props.href}
                    target={this.props.target || '_blank'}
                    rel="noreferrer noopener"
                    {...this.props}
                >{this.props.children}
                </A>
            );
        }

        return LinkComponent;
    }
}

Link.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object,
        PropTypes.array,
        PropTypes.node,
    ]).isRequired,
    className: PropTypes.string,
    href: PropTypes.string,
    target: PropTypes.string,
    to: PropTypes.string,
    onClick: PropTypes.func,
    isGreen: PropTypes.bool,
    isGray: PropTypes.bool,
};

export default Link;