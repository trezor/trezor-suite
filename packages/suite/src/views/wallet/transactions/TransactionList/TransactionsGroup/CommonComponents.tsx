import styled from 'styled-components';
import { variables } from '@trezor/components';
import { zIndices } from '@trezor/theme';
import { HiddenPlaceholder } from 'src/components/suite';
import { SUBPAGE_NAV_HEIGHT } from 'src/constants/suite/layout';

export const HeaderWrapper = styled.div`
    display: flex;
    position: sticky;
    background: ${({ theme }) => theme.backgroundSurfaceElevation0};
    top: ${SUBPAGE_NAV_HEIGHT};
    align-items: center;
    justify-content: space-between;
    flex: 1;
    padding-top: 8px;
    padding-bottom: 8px;
    padding-right: 24px;
    z-index: ${zIndices.secondaryStickyBar};
`;

export const Col = styled(HiddenPlaceholder)`
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

export const ColDate = styled(Col)`
    font-variant-numeric: tabular-nums;
    flex: 1;
`;

export const ColPending = styled(Col)`
    color: ${({ theme }) => theme.TYPE_ORANGE};
    font-variant-numeric: tabular-nums;
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
