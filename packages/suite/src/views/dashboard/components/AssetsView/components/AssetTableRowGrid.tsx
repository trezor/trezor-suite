import styled, { css } from 'styled-components';
import { ArrowIcon } from './AssetInfo';

export const AssetTableRowGrid = styled.div`
    display: grid;
    overflow: hidden;
    grid-template-columns: 2fr 2fr 1fr 1fr 1fr;
    border-radius: 8px;

    ${({ onClick }) =>
        onClick !== undefined
            ? css`
                  cursor: pointer;
                  :hover {
                      background: #d9d9d933;

                      ${ArrowIcon} {
                          opacity: 1;
                      }
                  }
              `
            : ''};
`;
