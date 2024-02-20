import styled from 'styled-components';
import { Elevation, mapElevationToBorder, spacingsPx } from '@trezor/theme';
import { useElevation } from '../ElevationContext/ElevationContext';

const Line = styled.div<{ elevation: Elevation }>`
    width: 100%;
    height: 1px;
    background: ${({ theme, elevation }) => mapElevationToBorder({ theme, elevation })};
    margin: ${spacingsPx.md} 0;
`;

export const Divider = () => {
    const { elevation } = useElevation();

    return <Line elevation={elevation} />;
};
