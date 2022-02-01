import React from 'react';
import styled from 'styled-components';

import { variables } from '@trezor/components';
import { CARD_PADDING_SIZE } from '@suite-constants/layout';
import { SECONDARY_PANEL_HEIGHT } from '../../AppNavigation';
import { anchorOutlineStyles } from '@suite-utils/anchor';

const Wrapper = styled.div<{ shouldHighlight?: boolean }>`
    padding: 0 ${CARD_PADDING_SIZE};
    display: flex;
    flex-direction: column;

    &:not(:first-child) {
        > * {
            border-top: 1px solid ${props => props.theme.STROKE_GREY};
        }
    }

    &:first-of-type {
        border-top-left-radius: 12px;
        border-top-right-radius: 12px;
    }

    &:last-of-type {
        border-bottom-left-radius: 12px;
        border-bottom-right-radius: 12px;
    }

    /* height of secondary panel and a gap between sections */
    scroll-margin-top: calc(${SECONDARY_PANEL_HEIGHT} + 79px);

    ${anchorOutlineStyles}
`;

const Content = styled.div`
    display: flex;
    padding: ${CARD_PADDING_SIZE} 0;

    @media all and (max-width: ${variables.SCREEN_SIZE.SM}) {
        flex-direction: column;
    }
`;

interface Props extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

const SectionItem = ({ children, ...rest }: Props) => <StyledRow {...rest}>{children}</StyledRow>;

export default SectionItem;
