import { Card } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import styled from 'styled-components';
import CoinmarketFormInputs from './CoinmarketFormInputs';

const CoinmarketFormLayoutWrapper = styled.form`
    display: flex;
    justify-content: space-between;

    padding-bottom: ${spacingsPx.xxxl};
`;

const CoinmarketFormInputsWrapper = styled(Card)`
    padding: ${spacingsPx.xl} ${spacingsPx.xl} ${spacingsPx.lg};

    width: 62.05%;
`;
const CoinmarketFormOffer = styled(Card)`
    padding: ${spacingsPx.xl} ${spacingsPx.xl} ${spacingsPx.xxxl};
    width: 36.88%;
`;

const CoinmarketFormLayout = () => {
    return (
        <CoinmarketFormLayoutWrapper>
            <CoinmarketFormInputsWrapper>
                <CoinmarketFormInputs />
            </CoinmarketFormInputsWrapper>
            <CoinmarketFormOffer>OFFER</CoinmarketFormOffer>
        </CoinmarketFormLayoutWrapper>
    );
};

export default CoinmarketFormLayout;
