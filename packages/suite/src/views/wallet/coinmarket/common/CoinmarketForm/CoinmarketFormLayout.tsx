import { Card } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import styled from 'styled-components';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';
import CoinmarketFormInputs from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInputs';
import CoinmarketFormOffer from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormOffer';
import CoinmarketFeaturedOffers from 'src/views/wallet/coinmarket/common/CoinmarketFeaturedOffers/CoinmarketFeaturedOffers';

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
    width: 60%;

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
    width: 37%;

    ${SCREEN_QUERY.BELOW_DESKTOP} {
        padding: ${spacingsPx.md} ${spacingsPx.md} ${spacingsPx.xxl};
        width: 49%;
    }

    ${SCREEN_QUERY.BELOW_LAPTOP} {
        width: 100%;
        margin-top: ${spacingsPx.sm};
    }
`;

const CoinmarketFormLayout = () => (
    <>
        <CoinmarketFormLayoutWrapper>
            <CoinmarketFormInputsWrapper>
                <CoinmarketFormInputs />
            </CoinmarketFormInputsWrapper>
            <CoinmarketFormOfferWrapper>
                <CoinmarketFormOffer />
            </CoinmarketFormOfferWrapper>
        </CoinmarketFormLayoutWrapper>
        <CoinmarketFeaturedOffers />
    </>
);

export default CoinmarketFormLayout;
