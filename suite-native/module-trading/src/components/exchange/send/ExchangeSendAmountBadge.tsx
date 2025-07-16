import { useSelector } from 'react-redux';

import { selectTradingExchangeIsLoading } from '@suite-common/trading';
import { FiatRatesRootState, WalletSettingsRootState } from '@suite-common/wallet-core';
import { Badge } from '@suite-native/atoms';
import { useField } from '@suite-native/forms';

import { useExchangeFormContext } from '../../../hooks/exchange/useExchangeFormContext';
import { TradingRootState } from '../../../reducers';
import { selectAmountInBaseFiatCurrency } from '../../../selectors/commonSelectors';
import { TradeableAsset } from '../../../types/general';
import { FiatAmountBadge } from '../../general/FiatAmountBadge';

type ExchangeSendFiatAmountBadgeProps = {
    amount: string;
    asset: TradeableAsset;
};

const ExchangeSendFiatAmountBadge = ({ amount, asset }: ExchangeSendFiatAmountBadgeProps) => {
    const fiatAmount = useSelector(
        (state: FiatRatesRootState & WalletSettingsRootState & TradingRootState) =>
            selectAmountInBaseFiatCurrency(state, asset, amount),
    );

    return <FiatAmountBadge amount={fiatAmount} />;
};

export const ExchangeSendAmountBadge = () => {
    const { watch } = useExchangeFormContext();
    const isLoading = useSelector(selectTradingExchangeIsLoading);

    const { errorMessage, hasError, value } = useField({ name: 'sendCryptoAmount' });
    if (!isLoading && hasError) {
        return <Badge label={errorMessage} variant="red" size="small" />;
    }

    const asset = watch('sendAsset');
    if (!asset || !value) {
        return null;
    }

    return <ExchangeSendFiatAmountBadge amount={value} asset={asset} />;
};
