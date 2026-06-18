import styled from 'styled-components';

import { spacingsPx } from '@trezor/theme';

import { FEE_CARD_MIN_WIDTH } from './FeeCard';

export const FeeCardsWrapper = styled.div`
    width: 100%;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(${FEE_CARD_MIN_WIDTH}px, 1fr));
    flex-wrap: wrap;
    gap: ${spacingsPx.sm};
    align-items: stretch;
`;
