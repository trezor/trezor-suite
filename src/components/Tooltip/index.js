import Link from 'components/Link';
import PropTypes from 'prop-types';
import Tippy from '@tippy.js/react';
import React from 'react';
import colors from 'config/colors';
import { FONT_SIZE } from 'config/variables';
import styled from 'styled-components';

const Content = styled.div`
    max-width: ${props => `${props.maxWidth}px` || 'auto'};
`;

const ContentWrapper = styled.div`
    display: block;
    background: ${colors.TOOLTIP_BACKGROUND};
    color: white;
    border-radius: 3px;
    font-size: ${FONT_SIZE.SMALL};
    padding: 8px 0px;
    text-align: left;
`;

const CTAWrapper = styled.div`
    margin-top: 15px;
    padding: 12px 0 0 0;
    text-align: center;
    width: 100%;
    border-top: 1px solid ${colors.TEXT_SECONDARY};
`;

const StyledLink = styled(Link)`
    &,
    &:visited,
    &:active,
    &:hover {
        color: ${colors.WHITE};
        text-decoration: none;
    }
`;

const Tooltip = ({ maxWidth, placement, content, ctaText, ctaLink, children, ...rest }) => {
    const Overlay = (
        <ContentWrapper>
            <Content maxWidth={maxWidth}>{content}</Content>
            {ctaLink && (
                <StyledLink isGray href={ctaLink}>
                    <CTAWrapper>{ctaText}</CTAWrapper>
                </StyledLink>
            )}
        </ContentWrapper>
    );

    /* TODO: Figure out why styled-components does not forward ref from the Icon component. https://github.com/atomiks/tippy.js-react#component-children */
    return (
        <Tippy
            placement={placement}
            content={Overlay}
            offset={4}
            zIndex={10070}
            arrow
            interactive
            {...rest}
        >
            <span>{children}</span>
        </Tippy>
    );
};

Tooltip.propTypes = {
    className: PropTypes.string,
    placement: PropTypes.string,
    children: PropTypes.oneOfType([PropTypes.element, PropTypes.string]),
    maxWidth: PropTypes.number,
    content: PropTypes.oneOfType([PropTypes.element, PropTypes.string]),
    ctaLink: PropTypes.string,
    ctaText: PropTypes.node,
};

export default Tooltip;
