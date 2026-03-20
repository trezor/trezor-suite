import { selectLanguage } from '@suite/settings';
import { Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';
import { TradingFormInputCurrency } from 'src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputCurrency';

interface TradingFormOfferFiatAmountProps {
    amount: string | undefined;
}

export const TradingFormOfferFiatAmount = ({ amount }: TradingFormOfferFiatAmountProps) => {
    const locale = useSelector(selectLanguage);
    const formattedAmount = amount ? new Intl.NumberFormat(locale).format(Number(amount)) : '';

    return (
        <Row gap={spacings.sm}>
            <Text
                data-testid="@trading/best-offer/amount"
                typographyStyle="headline-md"
                ellipsisLineCount={1}
            >
                {formattedAmount}
            </Text>
            <TradingFormInputCurrency width={100} />
        </Row>
    );
};
