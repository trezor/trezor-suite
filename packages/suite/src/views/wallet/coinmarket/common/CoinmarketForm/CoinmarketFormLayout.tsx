import styled from 'styled-components';
import { CoinmarketFormInputs } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInputs';
import { CoinmarketFormOffer } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormOffer';
import { CoinmarketFeaturedOffers } from 'src/views/wallet/coinmarket/common/CoinmarketFeaturedOffers/CoinmarketFeaturedOffers';
import {
    CoinmarketSideWrapper,
    CoinmarketWrapper,
} from 'src/views/wallet/coinmarket/common/CoinmarketWrapper';

const CoinmarketFormLayoutWrapper = styled.form`
    ${CoinmarketWrapper}
`;

export const CoinmarketFormLayout = () => (
    <>
        <CoinmarketFormLayoutWrapper>
            <CoinmarketSideWrapper side="left">
                <CoinmarketFormInputs />
            </CoinmarketSideWrapper>
            <CoinmarketSideWrapper side="right">
                <CoinmarketFormOffer />
            </CoinmarketSideWrapper>
        </CoinmarketFormLayoutWrapper>
        <CoinmarketFeaturedOffers />
    </>
);
