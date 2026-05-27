import { type ReactNode, type UIEventHandler, createContext, useCallback, useState } from 'react';

import styled from 'styled-components';

import { variables } from '@trezor/components';
import { type Elevation, mapElevationToBackground, mapElevationToBorder } from '@trezor/theme';

const Wrapper = styled.div<{ $elevation: Elevation }>`
    background: ${mapElevationToBackground};
    border-left: 1px solid ${mapElevationToBorder};
    display: flex;
    height: 100%;
    flex-direction: column;
    overflow: hidden scroll;
    -webkit-app-region: no-drag;
    min-width: ${variables.LAYOUT_SIZE.GUIDE_PANEL_MIN_WIDTH - 1}px;
`;

export const ContentScrolledContext = createContext<boolean>(false);

type GuideViewWrapperProps = {
    children: ReactNode;
};

export const GuideViewWrapper = ({ children }: GuideViewWrapperProps) => {
    const [isScrolled, setIsScrolled] = useState<boolean>(false);

    const onScroll: UIEventHandler<HTMLDivElement> = useCallback(e => {
        if (e?.currentTarget?.scrollTop) {
            setIsScrolled(true);
        } else {
            setIsScrolled(false);
        }
    }, []);

    return (
        <Wrapper $elevation={-1} onScroll={onScroll}>
            <ContentScrolledContext.Provider value={isScrolled}>
                {children}
            </ContentScrolledContext.Provider>
        </Wrapper>
    );
};
