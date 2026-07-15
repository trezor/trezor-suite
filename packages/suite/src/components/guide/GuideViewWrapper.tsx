import { Children, type ReactNode } from 'react';

import styled from 'styled-components';

import { variables } from '@trezor/components';

const Wrapper = styled.div`
    background: ${({ theme }) => theme.surfaceFillSunken};
    border-left: 1px solid ${({ theme }) => theme.surfaceBorderSunken};
    display: flex;
    height: 100%;
    flex-direction: column;
    overflow: hidden;
    -webkit-app-region: no-drag;
    min-width: ${variables.LAYOUT_SIZE.GUIDE_PANEL_MIN_WIDTH - 1}px;
`;

// Only the content scrolls (and rubber-bands on overscroll); the header stays fixed above it.
const ScrollableContent = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    overflow: hidden scroll;
`;

type GuideViewWrapperProps = {
    children: ReactNode;
};

export const GuideViewWrapper = ({ children }: GuideViewWrapperProps) => {
    // Every view renders the GuideHeader as its first child; keep it out of the
    // scroll container so the overscroll bounce only affects the content below it.
    const [header, ...content] = Children.toArray(children);

    return (
        <Wrapper>
            {header}
            <ScrollableContent>{content}</ScrollableContent>
        </Wrapper>
    );
};
