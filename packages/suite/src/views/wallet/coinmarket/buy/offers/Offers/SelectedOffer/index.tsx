import styled from 'styled-components';
import { Card, variables } from '@trezor/components';
import VerifyAddress from './components/VerifyAddress';
import { CoinmarketBuyOfferInfo } from '../../../components/CoinmarketBuyOfferInfo';
import { spacingsPx } from '@trezor/theme';
import { CoinmarketTradeBuyType } from 'src/types/coinmarket/coinmarket';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';

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
        useCoinmarketFormContext<CoinmarketTradeBuyType>();

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
