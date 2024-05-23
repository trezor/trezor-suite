import { Translation } from 'src/components/suite';
import { CoinmarketParagraph } from '../..';
import { Card } from '@trezor/components';
import { spacings } from '@trezor/theme';

const CoinmarketOffersEmpty = () => {
    return (
        <Card margin={{ top: spacings.md }}>
            <CoinmarketParagraph>
                <Translation id="TR_COINMARKET_OFFERS_EMPTY" />
            </CoinmarketParagraph>
        </Card>
    );
};

export default CoinmarketOffersEmpty;
