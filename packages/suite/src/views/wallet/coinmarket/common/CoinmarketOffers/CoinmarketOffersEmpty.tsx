import { Translation } from 'src/components/suite';
import { Card, Paragraph } from '@trezor/components';
import { spacings } from '@trezor/theme';

const CoinmarketOffersEmpty = () => {
    return (
        <Card margin={{ top: spacings.md }}>
            <Paragraph align="center" variant="tertiary">
                <Translation id="TR_COINMARKET_OFFERS_EMPTY" />
            </Paragraph>
        </Card>
    );
};

export default CoinmarketOffersEmpty;
