import { type ReactNode, useRef } from 'react';

import styled from 'styled-components';

import { useResponsiveContextOnChange } from './useResponsiveContextOnChange';

export const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: row;
    overflow: auto;
`;

export const PageWrapper = styled.div`
    position: relative;
    display: flex;
    flex: 1;
    flex-direction: column;
    height: 100dvh;
    overflow-x: hidden;
`;

export const Body = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
`;

// AppScrollArea and MenuSecondary creates own scrollbars independently
export const Columns = styled.div`
    display: flex;
    flex-direction: row;
    flex: 1 0 100%;
    overflow: auto;
    padding: 0;
`;

export const MainContentContainer = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    overflow-x: hidden;
`;

type MainContentProps = {
    children: ReactNode;
};

export const MainContent = ({ children }: MainContentProps) => {
    const ref = useRef<HTMLDivElement>(null);

    useResponsiveContextOnChange(ref);

    return <MainContentContainer ref={ref}>{children}</MainContentContainer>;
};
