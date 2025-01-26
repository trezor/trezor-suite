import styled from 'styled-components';

import { Spinner, useElevation } from '@trezor/components';
import { Elevation, borders, mapElevationToBackground, spacingsPx, zIndices } from '@trezor/theme';

const TradingFormInputLoaderWrapper = styled.div<{ $elevation: Elevation }>`
    display: flex;
    align-items: center;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: ${mapElevationToBackground};
    border-radius: ${borders.radii.sm};
    z-index: ${zIndices.base};
    padding: 0 ${spacingsPx.md};
`;

export const TradingFormInputLoader = () => {
    const { elevation } = useElevation();

    return (
        <TradingFormInputLoaderWrapper $elevation={elevation}>
            <Spinner size={24} isGrey={false} />
        </TradingFormInputLoaderWrapper>
    );
};
