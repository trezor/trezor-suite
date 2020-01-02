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
    background: ${colors.WHITE};
    color: ${colors.BLACK0};
    border-radius: 4px;
    font-size: ${FONT_SIZE.NORMAL};
    padding: 10px;
    text-align: left;
    box-shadow: 0 4px 10px 0 rgba(0, 0, 0, 0.15);
`;

const CTAWrapper = styled.div`
    margin-top: 15px;
    padding: 12px 0 0 0;
    text-align: center;
    width: 100%;
`;

const StyledLink = styled(Link)`
    &,
    &:visited,
    &:active,
    &:hover {
        color: ${colors.BLACK0};
        text-decoration: none;
    }
`;

const StyledTippy = styled(Tippy)`
    .tippy-arrow {
        border: 10px solid transparent;
        width: 0px;
        height: 0px;
        position: absolute;
    }

    &[data-placement^='top'] {
        .tippy-arrow {
            border-top: 10px solid ${colors.WHITE};
            bottom: -20px;
        }
    }
    &[data-placement^='bottom'] {
        .tippy-arrow {
            border-bottom: 10px solid ${colors.WHITE};
            top: -20px;
        }
    }
    &[data-placement^='left'] {
        .tippy-arrow {
            border-left: 10px solid ${colors.WHITE};
            right: -20px;
        }
    }
    &[data-placement^='right'] {
        .tippy-arrow {
            border-right: 10px solid ${colors.WHITE};
            left: -20px;
        }
    }
`;

interface Props extends TippyProps {
    maxWidth?: number;
    ctaText?: React.ReactNode;
    ctaLink?: string;
}

const Tooltip = ({
    maxWidth,
    placement = 'top',
    content,
    ctaText,
    ctaLink,
    children,
    ...rest
}: Props) => {
    const Overlay = (
        <ContentWrapper>
            <Content maxWidth={maxWidth}>{content}</Content>
            {ctaLink && (
                <StyledLink href={ctaLink}>
                    <CTAWrapper>{ctaText}</CTAWrapper>
                </StyledLink>
            )}
        </ContentWrapper>
    );

    /* TODO: Figure out why styled-components does not forward ref from the Icon component. https://github.com/atomiks/tippy.js-react#component-children */
    return (
        <StyledTippy
            placement={placement}
            zIndex={10070}
            arrow
            interactive
            {...rest}
            content={Overlay}
        >
            <span>{children}</span>
        </StyledTippy>
    );
};

export { Tooltip, Props as TooltipProps };
