import { spacings } from '@trezor/theme';
import { Row, Text } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { selectLanguage } from 'src/reducers/suite/suiteReducer';
import { CoinmarketFormInputCurrency } from 'src/views/wallet/coinmarket/common/CoinmarketForm/CoinmarketFormInput/CoinmarketFormInputCurrency';

interface CoinmarketFormOfferFiatAmountProps {
    amount: string | undefined;
}

export const CoinmarketFormOfferFiatAmount = ({ amount }: CoinmarketFormOfferFiatAmountProps) => {
    const locale = useSelector(selectLanguage);
    const formattedAmount = amount ? new Intl.NumberFormat(locale).format(Number(amount)) : '';

    return (
        <Row gap={spacings.sm}>
            <Text typographyStyle="titleMedium" ellipsisLineCount={1}>
                {formattedAmount}
            </Text>
            <CoinmarketFormInputCurrency isClean={false} size="small" isDarkLabel={true} />
        </Row>
    );
};
