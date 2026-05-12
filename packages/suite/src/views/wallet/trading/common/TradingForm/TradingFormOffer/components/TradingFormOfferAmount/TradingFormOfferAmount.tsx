import { type CryptoId } from 'invity-api';

import { Translation } from '@suite/intl';
import { Column } from '@trezor/components';

import { type TradingGetAmountLabelsReturnProps } from 'src/types/trading/trading';
import { tradingGetRoundedFiatAmount } from 'src/utils/wallet/trading/tradingUtils';

import { TradingFormOfferCryptoAmount } from './TradingFormOfferCryptoAmount';
import { TradingFormOfferFiatAmount } from './TradingFormOfferFiatAmount';

type TradingFormOfferAmountProps = {
    amount: string | number;
    sendAmount: string;
    selectedAssetCryptoId: CryptoId | undefined;
    shouldDisplayFiatAmount: boolean;
    amountLabels: TradingGetAmountLabelsReturnProps;
};

export const TradingFormOfferAmount = ({
    amount,
    sendAmount,
    selectedAssetCryptoId,
    shouldDisplayFiatAmount,
    amountLabels,
}: TradingFormOfferAmountProps) => (
    <Column gap={8} data-testid="@trading/best-offer" margin={{ bottom: 16 }}>
        {selectedAssetCryptoId && <Translation id={amountLabels.offerLabel} />}
        {shouldDisplayFiatAmount || !selectedAssetCryptoId ? (
            <TradingFormOfferFiatAmount amount={tradingGetRoundedFiatAmount(sendAmount)} />
        ) : (
            <TradingFormOfferCryptoAmount amount={amount} cryptoId={selectedAssetCryptoId} />
        )}
    </Column>
);
