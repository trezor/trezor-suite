import styled from 'styled-components';

import { Card } from '@trezor/components';
import { CoinmarketFormInputs } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInputs';
import { CoinmarketFormOffer } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormOffer';
import { CoinmarketFeaturedOffers } from 'src/views/wallet/coinmarket/common/CoinmarketFeaturedOffers/CoinmarketFeaturedOffers';
import { CoinmarketWrapper } from 'src/views/wallet/coinmarket/common/CoinmarketWrapper';

const CoinmarketFormLayoutWrapper = styled.form`
    ${CoinmarketWrapper}
`;

export const CoinmarketFormLayout = () => (
    <>
        <CoinmarketFormLayoutWrapper>
            <Card>
                <CoinmarketFormInputs />
            </Card>
            <Card>
                <CoinmarketFormOffer />
            </Card>
        </CoinmarketFormLayoutWrapper>
        <CoinmarketFeaturedOffers />
    </>
);
