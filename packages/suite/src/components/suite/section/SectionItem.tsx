import { forwardRef, HTMLAttributes } from 'react';
import styled from 'styled-components';

import { variables } from '@trezor/components';
import { SECONDARY_PANEL_HEIGHT } from 'src/components/suite/AppNavigation/AppNavigation';
import { anchorOutlineStyles } from 'src/utils/suite/anchor';
import { spacingsPx } from '@trezor/theme';

const Content = styled.div`
    display: flex;
    padding: ${spacingsPx.md} 0;

    @media all and (max-width: ${variables.SCREEN_SIZE.SM}) {
        flex-direction: column;
    }
`;

const Wrapper = styled.div<{ shouldHighlight?: boolean }>`
    display: flex;
    flex-direction: column;

    &:not(:first-child) {
        > div {
            border-top: 1px solid ${({ theme }) => theme.borderOnElevation1};
        }
    }

    &:first-of-type {
        ${Content} {
            padding-top: 0;
        }
    }

    &:last-of-type {
        ${Content} {
            padding-bottom: 0;
        }
    }

    /* height of secondary panel and a gap between sections */
    scroll-margin-top: calc(${SECONDARY_PANEL_HEIGHT} + 79px);

    ${anchorOutlineStyles}
`;

interface SectionItemProps extends HTMLAttributes<HTMLDivElement> {
    shouldHighlight?: boolean;
}

export const SectionItem = forwardRef<HTMLDivElement, SectionItemProps>(
    ({ children, shouldHighlight, ...rest }, ref) => (
        <Wrapper ref={ref} shouldHighlight={shouldHighlight} {...rest}>
            <Content>{children}</Content>
        </Wrapper>
    ),
);
