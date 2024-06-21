import styled from 'styled-components';
import { Card } from '@trezor/components';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { spacingsPx } from '@trezor/theme';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';
import { CoinmarketTradeBuyType } from 'src/types/coinmarket/coinmarket';
import CoinmarketSelectedOfferVerify from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketSelectedOfferVerify';
import { CoinmarketSelectedOfferInfo } from 'src/views/wallet/coinmarket/common/CoinmarketSelectedOffer/CoinmarketSelectedOfferInfo';

const Wrapper = styled.div`
    display: flex;
    margin: ${spacingsPx.lg} 0;

    ${SCREEN_QUERY.BELOW_LAPTOP} {
        flex-direction: column;
    }
`;

const StyledCard = styled(Card)`
    flex: 1;
    padding: 0;
`;

export const CoinmarketSelectedOffer = () => {
    const { account, selectedQuote, buyInfo } = useCoinmarketFormContext<CoinmarketTradeBuyType>();

    if (!selectedQuote) return null;

    return (
        <Wrapper>
            <StyledCard>
                <CoinmarketSelectedOfferVerify />
            </StyledCard>
            <CoinmarketSelectedOfferInfo
                selectedQuote={selectedQuote}
                account={account}
                providers={buyInfo?.providerInfos}
            />
        </Wrapper>
    );
};
