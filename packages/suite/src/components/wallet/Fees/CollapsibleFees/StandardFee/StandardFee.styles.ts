import styled from 'styled-components';
// Can't be in `StandardFee` component because of circular dependency:
// - `StandardFee` imports `BitcoinFeeCards`, `EthereumFeeCards`, `MiscFeeCards`
// - `BitcoinFeeCards`, `EthereumFeeCards`, `MiscFeeCards` import `FeeCardsWrapper`
export const FeeCardsWrapper = styled.div`
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: stretch;
`;
