import styled from 'styled-components';

import { spacingsPx } from '@trezor/theme';

// Can't be in `StandardFee` component because of circular dependency:
// - `StandardFee` imports `BitcoinFeeCards`, `EthereumFeeCards`, `MiscFeeCards`
// - `BitcoinFeeCards`, `EthereumFeeCards`, `MiscFeeCards` import `FeeCardsWrapper`
export const FeeCardsWrapper = styled.div`
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    gap: ${spacingsPx.sm};
    align-items: stretch;
`;
