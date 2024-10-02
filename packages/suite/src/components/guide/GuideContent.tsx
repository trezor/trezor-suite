import { ReactNode } from 'react';
import styled from 'styled-components';
import { spacingsPx } from '@trezor/theme';

const Wrapper = styled.div`
    padding: ${spacingsPx.md} ${spacingsPx.lg} 0;
    flex: 1;
`;

type GuideContentProps = {
    children: ReactNode;
};

export const GuideContent = ({ children }: GuideContentProps) => <Wrapper>{children}</Wrapper>;
