import { useSelector } from 'react-redux';

import { invariant } from '@suite-common/suite-utils';
import { selectTradingExchangeIsLoading } from '@suite-common/trading';
import { type FiatRatesRootState, type WalletSettingsRootState } from '@suite-common/wallet-core';
import { Badge } from '@suite-native/atoms';
import { useField } from '@suite-native/forms';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';
import { type TradingRootState, selectAmountInBaseFiatCurrency } from '@suite-native/trading-state';
import { type TradeableAsset } from '@suite-native/trading-types';

import { useExchangeFormContext } from '../../../hooks/exchange/useExchangeFormContext';
import { useConvertFormValueToBaseUnit } from '../../../hooks/general/useConvertFormValueToBaseUnit';
import { FiatAmountBadge } from '../../general/FiatAmountBadge';

type ExchangeSendFiatAmountBadgeProps = {
    amount: string;
    asset: TradeableAsset;
};

const ExchangeSendFiatAmountBadge = ({ amount, asset }: ExchangeSendFiatAmountBadgeProps) => {
    const { convertStrToBaseUnit } = useConvertFormValueToBaseUnit();
    const symbol = getSymbolFromTradeableAsset(asset);
    invariant(symbol, 'Asset symbol is undefined');

    const convertedAmount = convertStrToBaseUnit(amount, symbol);
    invariant(convertedAmount, 'Amount could not be converted to base unit');

    const fiatAmount = useSelector(
        (state: FiatRatesRootState & WalletSettingsRootState & TradingRootState) =>
            selectAmountInBaseFiatCurrency(state, asset, convertedAmount),
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
