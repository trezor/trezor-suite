import styled, { css } from 'styled-components';
import { borders, mapElevationToBackground } from '@trezor/theme';
import { styledHoverOnParentOfArrowIcon } from './ArrowIcon';
import { Elevation, nextElevation } from '@trezor/theme/src/elevation';
import { useElevation } from '@trezor/components';
import { HTMLAttributes } from 'react';

const StyledAssetTableRowGrid = styled.div<{ elevation: Elevation }>`
    display: grid;
    overflow: hidden;
    grid-template-columns: 1fr 2fr 2fr 1fr 1fr 1fr;
    border-radius: ${borders.radii.xs};

    ${({ theme, elevation, onClick }) =>
        onClick !== undefined
            ? css`
                  cursor: pointer;

                  ${styledHoverOnParentOfArrowIcon}

                  :hover {
                      background: ${mapElevationToBackground({
                          theme,
                          elevation: nextElevation[elevation],
                      })};
                  }
              `
            : ''};
`;

export const AssetTableRowGrid = ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => {
    const { elevation } = useElevation();

    return (
        <StyledAssetTableRowGrid {...props} elevation={elevation}>
            {children}
        </StyledAssetTableRowGrid>
    );
};
