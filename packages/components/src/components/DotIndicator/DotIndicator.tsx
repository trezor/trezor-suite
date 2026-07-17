import styled from 'styled-components';

import { Box } from '../Box/Box';

const Circle = styled.div<{ $isActive?: boolean }>`
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${({ theme, $isActive }) =>
        $isActive ? theme.contentBrand : theme.elementFillNeutralBold};
    transition:
        background 0.5s,
        outline 0.5s;
    outline: ${({ theme, $isActive }) =>
        `4px solid ${$isActive ? theme.elementFillBrandSofter : 'transparent'}`};
`;

export type DotIndicatorProps = {
    isActive?: boolean;
};

export const DotIndicator = ({ isActive }: DotIndicatorProps) => (
    <Box padding={4}>
        <Circle $isActive={isActive} />
    </Box>
);
