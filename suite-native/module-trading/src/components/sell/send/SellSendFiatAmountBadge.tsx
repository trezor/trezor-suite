import { useSelector } from 'react-redux';

import { invariant } from '@suite-common/suite-utils';
import { type FiatRatesRootState, type WalletSettingsRootState } from '@suite-common/wallet-core';
import { useWatch } from '@suite-native/forms';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';
import { type TradingRootState, selectAmountInBaseFiatCurrency } from '@suite-native/trading-state';
import { type TradeableAsset } from '@suite-native/trading-types';

import { useConvertFormValueToBaseUnit } from '../../../hooks/general/useConvertFormValueToBaseUnit';
import { useSellFormContext } from '../../../hooks/sell/useSellFormContext';
import { FiatAmountBadge } from '../../general/FiatAmountBadge';

type SellSendFiatAmountBadgeContentProps = {
    amount: string;
    asset: TradeableAsset;
};

const SellSendFiatAmountBadgeContent = ({ amount, asset }: SellSendFiatAmountBadgeContentProps) => {
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

export const SellSendFiatAmountBadge = () => {
    const { control } = useSellFormContext();
    const [asset, amount] = useWatch({
        control,
        name: ['sendAsset', 'cryptoStringAmount'],
    });

    if (!amount || !asset) {
        return null;
    }

    return <SellSendFiatAmountBadgeContent amount={amount} asset={asset} />;
};
