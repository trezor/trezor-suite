import React, { createContext, useCallback, useState } from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
    background: ${({ theme }) => theme.BG_WHITE};
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
    overflow-y: scroll;
    width: 100%;
`;

export const ContentScrolledContext = createContext<boolean>(false);

type ViewWrapperProps = {
    children: React.ReactNode;
};

export const ViewWrapper = ({ children }: ViewWrapperProps) => {
    const [isScrolled, setIsScrolled] = useState<boolean>(false);

    const onScroll = useCallback((e: React.UIEvent<HTMLDivElement, UIEvent>) => {
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
