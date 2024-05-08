import styled from 'styled-components';
import { Card, variables } from '@trezor/components';
import VerifyAddress from './components/VerifyAddress';
import { CoinmarketBuyOfferInfo } from '../../../components/CoinmarketBuyOfferInfo';
import { spacingsPx } from '@trezor/theme';
import { useCoinmarketOffersContext } from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import { CoinmarketTradeBuyType } from 'src/types/coinmarket/coinmarket';

const Wrapper = styled.div`
    display: flex;
    margin: ${spacingsPx.lg} 0;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        flex-direction: column;
    }
`;

const StyledCard = styled(Card)`
    flex: 1;
    padding: 0;
`;

const SelectedOffer = () => {
    const { account, selectedQuote, providersInfo } =
        useCoinmarketOffersContext<CoinmarketTradeBuyType>();
    if (!selectedQuote) return null;

    return (
        <Wrapper>
            <StyledCard>
                <VerifyAddress />
            </StyledCard>
            <CoinmarketBuyOfferInfo
                selectedQuote={selectedQuote}
                account={account}
                providers={providersInfo}
                data-test="@CoinmarketBuyOfferInfo"
            />
        </Wrapper>
    );
};

export default SelectedOffer;
