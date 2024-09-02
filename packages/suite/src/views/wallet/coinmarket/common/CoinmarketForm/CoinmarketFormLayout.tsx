import styled from 'styled-components';
import { CoinmarketFormInputs } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInputs';
import CoinmarketFormOffer from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormOffer';
import { CoinmarketFeaturedOffers } from 'src/views/wallet/coinmarket/common/CoinmarketFeaturedOffers/CoinmarketFeaturedOffers';
import {
    CoinmarketWrapper,
    CoinmarketLeftWrapper,
    CoinmarketRightWrapper,
} from 'src/views/wallet/coinmarket';

const CoinmarketFormLayoutWrapper = styled.form`
    ${CoinmarketWrapper}
`;

export const CoinmarketFormLayout = () => (
    <>
        <CoinmarketFormLayoutWrapper>
            <CoinmarketLeftWrapper>
                <CoinmarketFormInputs />
            </CoinmarketLeftWrapper>
            <CoinmarketRightWrapper>
                <CoinmarketFormOffer />
            </CoinmarketRightWrapper>
        </CoinmarketFormLayoutWrapper>
        <CoinmarketFeaturedOffers />
    </>
);
