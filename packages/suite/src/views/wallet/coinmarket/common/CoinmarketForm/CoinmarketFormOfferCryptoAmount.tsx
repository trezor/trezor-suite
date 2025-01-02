import { CryptoId } from 'invity-api';

import { Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { FormattedCryptoAmount } from 'src/components/suite';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';
import { CoinmarketCoinLogo } from 'src/views/wallet/coinmarket/common/CoinmarketCoinLogo';

interface CoinmarketCryptoAmountProps {
    amount: string | number;
    cryptoId: CryptoId;
}

export const CoinmarketFormOfferCryptoAmount = ({
    amount,
    cryptoId,
}: CoinmarketCryptoAmountProps) => {
    const { cryptoIdToCoinSymbol } = useCoinmarketInfo();
    const coinSymbol = cryptoIdToCoinSymbol(cryptoId)?.toLowerCase(); // lowercase - possible can be a NetworkSymbol

    if (!coinSymbol) {
        return;
    }

    return (
        <Row gap={spacings.sm}>
            <CoinmarketCoinLogo cryptoId={cryptoId} />
            <Text
                data-testid="@coinmarket/form/offer/crypto-amount"
                typographyStyle="titleMedium"
                ellipsisLineCount={2}
            >
                <FormattedCryptoAmount
                    value={amount}
                    symbol={coinSymbol}
                    isRawString
                    isBalance={false}
                />
            </Text>
        </Row>
    );
};
