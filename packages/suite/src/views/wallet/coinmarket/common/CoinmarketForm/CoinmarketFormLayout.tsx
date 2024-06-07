import { Card } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import styled from 'styled-components';
import CoinmarketFormInputs from './CoinmarketFormInputs';
import CoinmarketFormOffer from './CoinmarketFormOffer';
import { CoinmarketTradeBuyType } from 'src/types/coinmarket/coinmarket';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';

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
    const { onSubmit, handleSubmit } = useCoinmarketFormContext<CoinmarketTradeBuyType>();

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
