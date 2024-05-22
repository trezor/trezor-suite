import { Card } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { CoinmarketParagraph } from '../..';

const CoinmarketOffersEmpty = () => {
    return (
        <Card>
            <CoinmarketParagraph>
                <Translation id="TR_COINMARKET_OFFERS_EMPTY" />
            </CoinmarketParagraph>
        </Card>
    );
};

export default CoinmarketOffersEmpty;
