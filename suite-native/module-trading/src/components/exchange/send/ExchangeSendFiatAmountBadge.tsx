import { useSelector } from 'react-redux';

import { invariant } from '@suite-common/suite-utils';
import { type FiatRatesRootState, type WalletSettingsRootState } from '@suite-common/wallet-core';
import { useWatch } from '@suite-native/forms';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';
import { type TradingRootState, selectAmountInBaseFiatCurrency } from '@suite-native/trading-state';
import { type TradeableAsset } from '@suite-native/trading-types';

import { useExchangeFormContext } from '../../../hooks/exchange/useExchangeFormContext';
import { useConvertFormValueToBaseUnit } from '../../../hooks/general/useConvertFormValueToBaseUnit';
import { FiatAmountBadge } from '../../general/FiatAmountBadge';

type ExchangeSendFiatAmountBadgeContentProps = {
    amount: string;
    asset: TradeableAsset;
};

const ExchangeSendFiatAmountBadgeContent = ({
    amount,
    asset,
}: ExchangeSendFiatAmountBadgeContentProps) => {
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

export const ExchangeSendFiatAmountBadge = () => {
    const { control } = useExchangeFormContext();
    const [asset, amount] = useWatch({
        control,
        name: ['sendAsset', 'sendCryptoAmount'],
    });

    if (!amount || !asset) {
        return null;
    }

    return <ExchangeSendFiatAmountBadgeContent amount={amount} asset={asset} />;
};
