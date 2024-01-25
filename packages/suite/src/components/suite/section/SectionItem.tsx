import { forwardRef, HTMLAttributes } from 'react';
import styled from 'styled-components';

import { variables } from '@trezor/components';
import { SECONDARY_PANEL_HEIGHT } from 'src/components/suite/AppNavigation/AppNavigation';
import { anchorOutlineStyles } from 'src/utils/suite/anchor';
import { borders, spacingsPx } from '@trezor/theme';

const Content = styled.div<{ shouldHighlight?: boolean }>`
    display: flex;
    padding: ${spacingsPx.md};
    margin: -${spacingsPx.md};
    border-radius: ${({ shouldHighlight }) => shouldHighlight && borders.radii.xs};

    ${anchorOutlineStyles}

    @media all and (max-width: ${variables.SCREEN_SIZE.SM}) {
        flex-direction: column;
    }
`;

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;

    :not(:last-child) {
        ::after {
            content: '';
            position: relative;
            top: ${spacingsPx.md};
            display: block;
            width: 100%;
            height: 1px;
            border-bottom: 1px solid ${({ theme }) => theme.borderOnElevation1};
        }
    }

    /* height of secondary panel and a gap between sections */
    scroll-margin-top: calc(${SECONDARY_PANEL_HEIGHT} + 79px);
`;

interface SectionItemProps extends HTMLAttributes<HTMLDivElement> {
    shouldHighlight?: boolean;
}

export const SectionItem = forwardRef<HTMLDivElement, SectionItemProps>(
    ({ children, shouldHighlight, ...rest }, ref) => (
        <Wrapper ref={ref} {...rest}>
            <Content shouldHighlight={shouldHighlight}>{children}</Content>
        </Wrapper>
    ),
);
