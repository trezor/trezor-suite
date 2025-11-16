import styled from 'styled-components';

import { variables } from '@trezor/components';

import { HiddenPlaceholder } from 'src/components/suite';

export const HeaderWrapper = styled.div`
    display: flex;
    background: ${({ theme }) => theme.backgroundSurfaceElevation0};
    align-items: center;
    justify-content: space-between;
    flex: 1;
    padding-right: 24px;
`;

export const Col = styled(HiddenPlaceholder)`
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${({ theme }) => theme.textSubdued};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

export const ColDate = styled(Col)`
    font-variant-numeric: tabular-nums;
    flex: 1;
`;

export const ColAmount = styled(Col)<{ $isVisible?: boolean }>`
    padding-left: 16px;
    text-align: right;
    opacity: ${({ $isVisible }) => ($isVisible ? 1 : 0)};
    transition: opacity 0.1s;
`;

export const ColFiat = styled(Col)`
    padding-left: 16px;
    text-align: right;
`;
