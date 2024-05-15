import styled from 'styled-components';
import { Elevation, mapElevationToBorder, spacings } from '@trezor/theme';
import { useElevation } from '../ElevationContext/ElevationContext';
import { FrameProps, TransientFrameProps, withFrameProps } from '../common/frameProps';

const Line = styled.div<{ $elevation: Elevation } & TransientFrameProps>`
    width: 100%;
    height: 1px;
    background: ${mapElevationToBorder};

    ${withFrameProps}
`;

export const Divider = ({
    margin = { top: spacings.md, bottom: spacings.md },
}: {
    margin?: FrameProps['margin'];
}) => {
    const { elevation } = useElevation();

    return <Line $elevation={elevation} $margin={margin} />;
};
