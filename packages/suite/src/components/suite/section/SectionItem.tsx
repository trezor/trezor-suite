import { forwardRef, HTMLAttributes } from 'react';
import styled from 'styled-components';

import { borders, spacingsPx } from '@trezor/theme';
import { variables } from '@trezor/components';
import { anchorOutlineStyles } from 'src/utils/suite/anchor';
import {} from '../Preloader/SuiteLayout/SubpageNavigation';
import { SUBPAGE_NAV_HEIGHT } from 'src/constants/suite/layout';

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
    scroll-margin-top: calc(${SUBPAGE_NAV_HEIGHT} + 79px);
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
