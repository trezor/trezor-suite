import { ReactNode } from 'react';

import styled from 'styled-components';

import { borders, Elevation, mapElevationToBackground, spacingsPx } from '@trezor/theme';
import { useElevation } from '@trezor/components';

const ChangelogWrapper = styled.div<{ $elevation: Elevation }>`
    background-color: ${({ theme, $elevation }) => mapElevationToBackground({ theme, $elevation })};
    border-radius: ${borders.radii.md};
    max-height: 400px;
    overflow-y: auto;
    padding: ${spacingsPx.md} ${spacingsPx.xl};
`;

export const GrayTag = styled.div`
    border-radius: ${borders.radii.full};
    background-color: ${({ theme }) => theme.backgroundNeutralSubtleOnElevation0};
    padding: ${spacingsPx.xxxs} ${spacingsPx.xs};
    color: ${({ theme }) => theme.textSubdued};
`;

export const Changelog = ({ children }: { children: ReactNode }) => {
    const { elevation } = useElevation();

    return <ChangelogWrapper $elevation={elevation}>{children}</ChangelogWrapper>;
};
