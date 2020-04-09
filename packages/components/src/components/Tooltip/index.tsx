import styled from 'styled-components';
import React from 'react';
import Tippy, { TippyProps } from '@tippy.js/react';
import { tippy } from './tippy.style';
import colors from '../../config/colors';
import { FONT_SIZE, FONT_WEIGHT } from '../../config/variables';

const Wrapper = styled.div`
    display: flex;
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

const Tooltip = ({
    placement = 'top',
    interactive = true,
    children,
    duration = 150,
    animation = 'scale',
    className,
    ...rest
}: TippyProps & { children: JSX.Element | JSX.Element[] | string }) => (
    <Wrapper className={className}>
        <Tippy
            zIndex={10070}
            arrow
            placement={placement}
            animation={animation}
            duration={duration}
            interactive={interactive}
            {...rest}
        >
            <span>{children}</span>
        </Tippy>
    </Wrapper>
);

export { Tooltip, TippyProps as TooltipProps };
