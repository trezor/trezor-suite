import { ReactNode } from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
    height: 100%;
    padding: 15px 21px 0;
`;

type GuideContentProps = {
    children: ReactNode;
};

export const GuideContent = ({ children }: GuideContentProps) => <Wrapper>{children}</Wrapper>;
