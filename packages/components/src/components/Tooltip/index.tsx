import styled from 'styled-components';
import React from 'react';
import Tippy, { TippyProps } from '@tippy.js/react';

import { Link } from '../Link';
import colors from '../../config/colors';
import { FONT_SIZE } from '../../config/variables';

const Content = styled.div<{ maxWidth?: number }>`
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

interface Props extends TippyProps {
    maxWidth?: number;
    ctaText?: React.ReactNode;
    ctaLink?: string;
}

const Tooltip = ({ maxWidth, placement, content, ctaText, ctaLink, children, ...rest }: Props) => {
    const Overlay = (
        <ContentWrapper>
            <Content maxWidth={maxWidth}>{content}</Content>
            {ctaLink && (
                <StyledLink variant="gray" href={ctaLink}>
                    <CTAWrapper>{ctaText}</CTAWrapper>
                </StyledLink>
            )}
        </ContentWrapper>
    );

    /* TODO: Figure out why styled-components does not forward ref from the Icon component. https://github.com/atomiks/tippy.js-react#component-children */
    return (
        <Tippy
            placement={placement}
            offset={4}
            zIndex={10070}
            arrow
            interactive
            {...rest}
            content={Overlay}
        >
            <span>{children}</span>
        </Tippy>
    );
};

export { Tooltip, Props as TooltipProps };
