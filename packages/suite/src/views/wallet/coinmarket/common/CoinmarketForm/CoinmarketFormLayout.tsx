import { Card } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import styled from 'styled-components';
import CoinmarketFormInputs from './CoinmarketFormInputs';
import CoinmarketFormOffer from './CoinmarketFormOffer';
import { useCoinmarketBuyFormContext } from 'src/hooks/wallet/useCoinmarketBuyForm';

const CoinmarketFormLayoutWrapper = styled.form`
    display: flex;
    justify-content: space-between;

    padding-bottom: ${spacingsPx.xxxl};
`;

const CoinmarketFormInputsWrapper = styled(Card)`
    padding: ${spacingsPx.xl} ${spacingsPx.xl} ${spacingsPx.lg};

    width: 62.05%;
`;
const CoinmarketFormOfferWrapper = styled(Card)`
    padding: ${spacingsPx.xl} ${spacingsPx.xl} ${spacingsPx.xxxl};
    width: 36.88%;
`;

const CoinmarketFormLayout = () => {
    const { onSubmit, handleSubmit } = useCoinmarketBuyFormContext();

    return (
        <CoinmarketFormLayoutWrapper onSubmit={handleSubmit(onSubmit)}>
            <CoinmarketFormInputsWrapper>
                <CoinmarketFormInputs />
            </CoinmarketFormInputsWrapper>
            <CoinmarketFormOfferWrapper>
                <CoinmarketFormOffer />
            </CoinmarketFormOfferWrapper>
        </CoinmarketFormLayoutWrapper>
    );
};

export default CoinmarketFormLayout;
