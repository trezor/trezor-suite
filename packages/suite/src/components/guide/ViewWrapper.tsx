import React, { createContext, useState } from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
    background: ${props => props.theme.BG_WHITE};
    display: flex;
    flex-direction: column;
    overflow-y: scroll;
    width: 100%;
`;

export const ContentScrolledContext = createContext<boolean>(false);

type Props = {
    children?: React.ReactNode;
};

const ViewWrapper = ({ children, ...rest }: Props) => {
    const [isScrolled, setIsScrolled] = useState<boolean>(false);

    const onScroll = (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
        if (e?.currentTarget?.scrollTop) {
            setIsScrolled(true);
        } else {
            setIsScrolled(false);
        }
    };

    return (
        <Wrapper onScroll={onScroll} {...rest}>
            <ContentScrolledContext.Provider value={isScrolled}>
                {children}
            </ContentScrolledContext.Provider>
        </Wrapper>
    );
};

export default ViewWrapper;
