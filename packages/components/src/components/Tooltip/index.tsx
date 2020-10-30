import styled from 'styled-components';
import React, { ReactNode } from 'react';
import Tippy, { TippyProps } from '@tippy.js/react';
import { tippy } from './tippy.style';
import colors from '../../config/colors';
import { Link } from '../typography/Link';
import { FONT_SIZE, FONT_WEIGHT } from '../../config/variables';

const tooltipGlobalStyles = `
${tippy}

.tippy-tooltip {
    background: ${colors.NEUE_BG_TOOLTIP};
    color: ${colors.WHITE};
    font-weight: ${FONT_WEIGHT.MEDIUM};
    border-radius: 5px;
    font-size: ${FONT_SIZE.TINY};
    text-align: left;
    box-shadow: 0 3px 14px 0 rgba(0, 0, 0, 0.15)

    .tippy-arrow {
        border: 5px solid transparent;
    }
}

.tippy-tooltip[data-placement^='top'] >
    .tippy-arrow {
        border-top-color: ${colors.NEUE_BG_TOOLTIP};
    }


.tippy-tooltip[data-placement^='bottom'] >
    .tippy-arrow {
        border-bottom-color: ${colors.NEUE_BG_TOOLTIP};
    }


.tippy-tooltip[data-placement^='left'] >
    .tippy-arrow {
        border-left-color: ${colors.NEUE_BG_TOOLTIP};
    }


.tippy-tooltip[data-placement^='right'] >
    .tippy-arrow {
        border-right-color: ${colors.NEUE_BG_TOOLTIP};
    }


.tippy-tooltip.dark-grey  {
    background: ${colors.NEUE_TYPE_DARK_GREY};
}
.tippy-tooltip.dark-grey[data-placement^='top'] > .tippy-arrow {
    border-top-color: ${colors.NEUE_TYPE_DARK_GREY};
}

.tippy-tooltip.dark-grey[data-placement^='bottom'] > .tippy-arrow {
    border-bottom-color: ${colors.NEUE_TYPE_DARK_GREY};
}

.tippy-tooltip.dark-grey[data-placement^='left'] > .tippy-arrow {
    border-left-color: ${colors.NEUE_TYPE_DARK_GREY};
}

.tippy-tooltip.dark-grey[data-placement^='right'] > .tippy-arrow {
    border-right-color: ${colors.NEUE_TYPE_DARK_GREY};
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
    <Wrapper>
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
            className={className}
            {...rest}
        >
            <Content>{children}</Content>
        </Tippy>
    </Wrapper>
);

export { Tooltip, TippyProps as TooltipProps, tooltipGlobalStyles };
