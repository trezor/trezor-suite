import styled, { css } from 'styled-components';
import React, { ReactNode } from 'react';
import Tippy, { TippyProps } from '@tippy.js/react';
import { tippy } from './tippy.style';
import colors from '../../config/colors';
import { Link } from '../typography/Link';
import { FONT_SIZE, FONT_WEIGHT } from '../../config/variables';
import { SuiteThemeColors } from '../../support/types';

const tooltipGlobalStyles = css`
    ${tippy}

    .tippy-tooltip {
        background: ${props => props.theme.BG_TOOLTIP};
        color: ${props => props.theme.TYPE_WHITE};
        font-weight: ${FONT_WEIGHT.MEDIUM};
        border-radius: 5px;
        font-size: ${FONT_SIZE.TINY};
        text-align: left;
        box-shadow: 0 3px 14px 0 rgba(0, 0, 0, 0.15);

        .tippy-arrow {
            border: 5px solid transparent;
        }
    }

    .tippy-tooltip[data-placement^='top'] > .tippy-arrow {
        border-top-color: ${props => props.theme.BG_TOOLTIP};
    }

    .tippy-tooltip[data-placement^='bottom'] > .tippy-arrow {
        border-bottom-color: ${props => props.theme.BG_TOOLTIP};
    }

    .tippy-tooltip[data-placement^='left'] > .tippy-arrow {
        border-left-color: ${props => props.theme.BG_TOOLTIP};
    }

    .tippy-tooltip[data-placement^='right'] > .tippy-arrow {
        border-right-color: ${props => props.theme.BG_TOOLTIP};
    }
`;

const Wrapper = styled.div``;

const Content = styled.div``;

const ReadMoreLink = styled(Link)`
    padding: 10px 0;
    justify-content: center;
    align-items: center;
    display: flex;
`;

type Props = TippyProps & {
    children: JSX.Element | JSX.Element[] | string;
    readMore?: { link: string; text: ReactNode } | null;
};

const Tooltip = ({
    placement = 'top',
    interactive = true,
    children,
    duration = 150,
    animation = 'scale',
    className,
    readMore = null,
    content,
    ...rest
}: Props) => (
    <Wrapper className={className}>
        <Tippy
            zIndex={10070}
            arrow
            placement={placement}
            animation={animation}
            duration={duration}
            interactive={interactive}
            appendTo={() => document.body}
            content={
                <>
                    {content}
                    {readMore && (
                        <ReadMoreLink variant="nostyle" href={readMore.link} target="_blank">
                            {readMore.text}
                        </ReadMoreLink>
                    )}
                </>
            }
            {...rest}
        >
            <Content>{children}</Content>
        </Tippy>
    </Wrapper>
);

export { Tooltip, TippyProps as TooltipProps, tooltipGlobalStyles };
