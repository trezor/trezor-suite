import Link from 'components/Link';
import PropTypes from 'prop-types';
import { Tooltip as Tippy } from 'react-tippy';
import React from 'react';
import colors from 'config/colors';
import { FONT_SIZE } from 'config/variables';
import styled from 'styled-components';

const Content = styled.div`
    max-width: ${props => `${props.maxWidth}px` || 'auto'};
`;

const ContentWrapper = styled.div`
    display: block;
    margin: 4px;
    background: ${colors.TOOLTIP_BACKGROUND};
    color: white;
    border-radius: 3px;
    font-size: ${FONT_SIZE.SMALL};
    /* min-height: 34px; */
    padding: 8px 10px;
`;

const CTAWrapper = styled.div`
    margin-top: 15px;
    padding: 10px 0 5px 0;
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

    return (
        <Tippy position={placement} html={Overlay} offset={4} interactive {...rest}>
            {children}
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
    ctaText: PropTypes.string,
};

export default Tooltip;
