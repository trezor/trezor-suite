import { createContext, useCallback, useState, ReactNode, UIEventHandler } from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';

const Wrapper = styled.div`
    background: ${({ theme }) => theme.backgroundSurfaceElevation0};
    display: flex;
    flex-direction: column;
    overflow: hidden scroll;
    min-width: ${variables.LAYOUT_SIZE.GUIDE_PANEL_CONTENT_WIDTH};
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
        <Wrapper onScroll={onScroll}>
            <ContentScrolledContext.Provider value={isScrolled}>
                {children}
            </ContentScrolledContext.Provider>
        </Wrapper>
    );
};
