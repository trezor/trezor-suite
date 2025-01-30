import styled from 'styled-components';

import { spacings, spacingsPx } from '@trezor/theme';

import { Box } from '../Box/Box';

const Circle = styled.div<{ $isActive?: boolean }>`
    width: ${spacingsPx.xs};
    height: ${spacingsPx.xs};
    border-radius: 50%;
    background: ${({ theme, $isActive }) =>
        $isActive ? theme.backgroundPrimaryDefault : theme.backgroundNeutralSubdued};
    transition:
        background 0.5s,
        outline 0.5s;
    outline: ${({ theme, $isActive }) =>
        `${spacingsPx.xxs} solid ${$isActive ? theme.backgroundPrimarySubtleOnElevation0 : 'transparent'}`};
`;

export type DotIndicatorProps = {
    isActive?: boolean;
};

export const DotIndicator = ({ isActive }: DotIndicatorProps) => (
    <Box padding={spacings.xxs}>
        <Circle $isActive={isActive} />
    </Box>
);
