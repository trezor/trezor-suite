import { Card } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import styled from 'styled-components';
import CoinmarketFormInputs from './CoinmarketFormInputs';
import CoinmarketFormOffer from './CoinmarketFormOffer';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';
import { CoinmarketSelectedOffer } from '../CoinmarketSelectedOffer/CoinmarketSelectedOffer';

const CoinmarketFormLayoutWrapper = styled.form`
    display: flex;
    justify-content: space-between;
    padding-bottom: ${spacingsPx.xxxl};

    ${SCREEN_QUERY.BELOW_LAPTOP} {
        flex-wrap: wrap;
    }
`;

const CoinmarketFormInputsWrapper = styled(Card)`
    padding: ${spacingsPx.xl} ${spacingsPx.xl} ${spacingsPx.lg};
    width: 62.05%;

    ${SCREEN_QUERY.BELOW_DESKTOP} {
        padding: ${spacingsPx.md};
        width: 49%;
    }

    ${SCREEN_QUERY.BELOW_LAPTOP} {
        width: 100%;
        padding-bottom: ${spacingsPx.zero};
    }
`;
const CoinmarketFormOfferWrapper = styled(Card)`
    padding: ${spacingsPx.xl} ${spacingsPx.xl} ${spacingsPx.xxxl};
    width: 36.88%;

    ${SCREEN_QUERY.BELOW_DESKTOP} {
        padding: ${spacingsPx.md} ${spacingsPx.md} ${spacingsPx.xxl};
        width: 49%;
    }

    ${SCREEN_QUERY.BELOW_LAPTOP} {
        width: 100%;
        margin-top: ${spacingsPx.sm};
    }
`;

const CoinmarketFormLayout = () => {
    const { selectedQuote } = useCoinmarketFormContext();

    if (selectedQuote) {
        return <CoinmarketSelectedOffer />;
    }

    return (
        <CoinmarketFormLayoutWrapper>
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
