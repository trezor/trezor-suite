import { CryptoId } from 'invity-api';

import { useTradingInfo } from '@suite-common/trading';
import { Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { FormattedCryptoAmount } from 'src/components/suite';
import { TradingCoinLogo } from 'src/views/wallet/trading/common/TradingCoinLogo';

interface TradingCryptoAmountProps {
    amount: string | number;
    cryptoId: CryptoId;
}

export const TradingFormOfferCryptoAmount = ({ amount, cryptoId }: TradingCryptoAmountProps) => {
    const { cryptoIdToSymbolAndContractAddress } = useTradingInfo();
    const { coinSymbol, contractAddress } = cryptoIdToSymbolAndContractAddress(cryptoId);

    if (!coinSymbol) {
        return;
    }

    return (
        <Row gap={spacings.sm}>
            <TradingCoinLogo cryptoId={cryptoId} />
            <Text
                data-testid="@trading/best-offer/amount"
                typographyStyle="titleMedium"
                ellipsisLineCount={2}
            >
                <FormattedCryptoAmount
                    value={amount}
                    symbol={coinSymbol}
                    contractAddress={contractAddress}
                    isRawString
                    isBalance={false}
                />
            </Text>
        </Row>
    );
};
