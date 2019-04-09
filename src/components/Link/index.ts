import React, { PureComponent } from 'react';
import styled from 'styled-components';

import { NavLink } from 'react-router-dom';
import PropTypes from 'prop-types';
import colors from 'config/colors';

const A = styled.a`
    text-decoration: none;
    cursor: pointer;
    color: ${props => (props.isGray ? colors.TEXT_SECONDARY : colors.GREEN_PRIMARY)};

    &:visited,
    &:active,
    &:hover {
        text-decoration: underline;
        color: ${props => (props.isGray ? colors.TEXT_SECONDARY : colors.GREEN_PRIMARY)};
    }
`;

const StyledNavLink = styled(NavLink)`
    color: ${props => (props.isGray ? colors.TEXT_SECONDARY : colors.GREEN_PRIMARY)};
`;

class Link extends PureComponent {
    render() {
        const shouldRenderRouterLink = this.props.to;
        let LinkComponent;
        if (shouldRenderRouterLink) {
            LinkComponent = <StyledNavLink {...this.props}>{this.props.children}</StyledNavLink>;
        } else {
            LinkComponent = (
                <A
                    href={this.props.href}
                    target={this.props.target || '_blank'}
                    rel="noreferrer noopener"
                    {...this.props}
                >
                    {this.props.children}
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
