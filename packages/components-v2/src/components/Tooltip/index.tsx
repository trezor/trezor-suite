import styled from 'styled-components';
import React from 'react';
import Tippy, { TippyProps } from '@tippy.js/react';
import { tippy } from './tippy.style';

import { Link } from '../Link';
import colors from '../../config/colors';
import { FONT_SIZE } from '../../config/variables';

const Content = styled.div<{ maxWidth?: number }>`
    max-width: ${props => `${props.maxWidth}px` || 'auto'};
`;

const ContentWrapper = styled.div``;

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

const TippyWrapper = styled.div`
    ${tippy};

    .tippy-tooltip {
        background: ${colors.WHITE};
        color: ${colors.BLACK0};
        border-radius: 4px;
        font-size: ${FONT_SIZE.NORMAL};
        padding: 8px 10px 6px;
        text-align: left;
        box-shadow: 0 4px 10px 0 rgba(0, 0, 0, 0.15);

        .tippy-arrow {
            border: 5px solid transparent;
        }

        &[data-placement^='top'] {
            .tippy-arrow {
                border-top-color: ${colors.WHITE};
            }
        }
        &[data-placement^='bottom'] {
            .tippy-arrow {
                border-bottom-color: ${colors.WHITE};
            }
        }
        &[data-placement^='left'] {
            .tippy-arrow {
                border-left-color: ${colors.WHITE};
            }
        }
        &[data-placement^='right'] {
            .tippy-arrow {
                border-right-color: ${colors.WHITE};
            }
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
    animation = 'fade',
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
        <TippyWrapper>
            <Tippy
                animation={animation}
                placement={placement}
                offset={0}
                zIndex={10070}
                arrow
                interactive
                content={Overlay}
                {...rest}
            >
                <span>{children}</span>
            </Tippy>
        </TippyWrapper>
    );
};

export { Tooltip, Props as TooltipProps };
