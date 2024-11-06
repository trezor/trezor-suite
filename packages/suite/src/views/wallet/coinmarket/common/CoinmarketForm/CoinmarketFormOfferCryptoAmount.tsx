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
    const networkSymbol = cryptoIdToCoinSymbol(cryptoId);

    if (!networkSymbol) {
        return;
    }

    return (
        <Row gap={spacings.sm}>
            <CoinmarketCoinLogo cryptoId={cryptoId} />
            <Text typographyStyle="titleMedium" ellipsisLineCount={2}>
                <FormattedCryptoAmount
                    value={amount}
                    symbol={networkSymbol}
                    isRawString
                    isBalance={false}
                />
            </Text>
        </Row>
    );
};
