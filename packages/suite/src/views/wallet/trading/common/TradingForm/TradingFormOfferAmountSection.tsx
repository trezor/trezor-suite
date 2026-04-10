import { type CryptoId } from 'invity-api';

import { Translation, type TranslationKey } from '@suite/intl';
import { Column } from '@trezor/components';

import { tradingGetRoundedFiatAmount } from 'src/utils/wallet/trading/tradingUtils';

import { TradingFormOfferCryptoAmount } from './TradingFormOfferCryptoAmount';
import { TradingFormOfferFiatAmount } from './TradingFormOfferFiatAmount';

interface TradingFormOfferAmountSectionProps {
    offerLabel: TranslationKey;
    selectedAssetCryptoId: CryptoId | undefined;
    cryptoAmount: string;
    amountInCrypto?: boolean;
    fiatSendAmount?: string;
}

export const TradingFormOfferAmountSection = ({
    offerLabel,
    selectedAssetCryptoId,
    cryptoAmount,
    amountInCrypto,
    fiatSendAmount,
}: TradingFormOfferAmountSectionProps) => (
    <Column gap={8} data-testid="@trading/best-offer" margin={{ bottom: 16 }}>
        {selectedAssetCryptoId && <Translation id={offerLabel} />}
        {amountInCrypto ? (
            <TradingFormOfferFiatAmount amount={tradingGetRoundedFiatAmount(fiatSendAmount)} />
        ) : (
            <TradingFormOfferCryptoAmount amount={cryptoAmount} cryptoId={selectedAssetCryptoId} />
        )}
    </Column>
);
