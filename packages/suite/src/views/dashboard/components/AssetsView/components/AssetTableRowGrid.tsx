import styled, { css } from 'styled-components';
import { ArrowIcon } from './AssetInfo';
import { borders } from '@trezor/theme';

export const AssetTableRowGrid = styled.div`
    display: grid;
    overflow: hidden;
    grid-template-columns: 2fr 2fr 1fr 1fr 1fr;
    border-radius: ${borders.radii.xs};

    ${({ onClick, theme }) =>
        onClick !== undefined
            ? css`
                  cursor: pointer;

                  :hover {
                      background: ${theme.backgroundSurfaceElevation2};

                      ${ArrowIcon} {
                          opacity: 1;
                      }
                  }
              `
            : ''};
`;
