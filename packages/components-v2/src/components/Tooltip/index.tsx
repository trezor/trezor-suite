import styled from 'styled-components';
import React from 'react';
import Tippy, { TippyProps } from '@tippy.js/react';
import { tippy } from './tippy.style';

import { Link } from '../Link';
import colors from '../../config/colors';
import { FONT_SIZE, FONT_WEIGHT } from '../../config/variables';

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
        background: ${colors.BLACK0};
        color: ${colors.WHITE};
        font-weight: ${FONT_WEIGHT.DEMI_BOLD};
        border-radius: 3px;
        font-size: ${FONT_SIZE.TINY};
        text-align: left;
        box-shadow: 0 4px 10px 0 rgba(0, 0, 0, 0.3);

        .tippy-arrow {
            border: 5px solid transparent;
        }

        &[data-placement^='top'] {
            .tippy-arrow {
                border-top-color: ${colors.BLACK0};
            }
        }
        &[data-placement^='bottom'] {
            .tippy-arrow {
                border-bottom-color: ${colors.BLACK0};
            }
        }
        &[data-placement^='left'] {
            .tippy-arrow {
                border-left-color: ${colors.BLACK0};
            }
        }
        &[data-placement^='right'] {
            .tippy-arrow {
                border-right-color: ${colors.BLACK0};
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
