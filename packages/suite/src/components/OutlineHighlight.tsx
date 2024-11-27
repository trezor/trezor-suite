import { ReactNode } from 'react';

import styled from 'styled-components';

import { borders, spacingsPx } from '@trezor/theme';

const Wrapper = styled.div<{ $shouldHighlight?: boolean }>`
    position: relative;

    &::before {
        content: '';
        position: absolute;
        inset: -${spacingsPx.lg};
        outline: solid ${borders.widths.large} ${({ theme }) => theme.backgroundAlertYellowBold};
        background: ${({ theme }) => theme.backgroundAlertYellowSubtleOnElevation1};
        transition: opacity 0.3s;
        transition-delay: 0.3s;
        opacity: 0;
        z-index: 0;
        border-radius: ${borders.radii.xs};

        ${({ $shouldHighlight }) => $shouldHighlight && 'opacity: 1;'};
    }
`;

const Content = styled.div`
    position: relative;
`;

type OutlineHighlightProps = {
    shouldHighlight?: boolean;
    children: ReactNode;
};

export const OutlineHighlight = ({ shouldHighlight, children }: OutlineHighlightProps) => (
    <Wrapper $shouldHighlight={shouldHighlight}>
        <Content>{children}</Content>
    </Wrapper>
);
