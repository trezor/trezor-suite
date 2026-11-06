import { memo } from 'react';
import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { BaseCurrencyAmountFormatter } from '@suite-native/formatters';

import { selectAssetFiatValue } from '../assetsSelectors';
import { type AssetsRootState } from '../types';

type FiatAmountProps = { symbol: NetworkSymbol };

export const FiatAmount = memo(({ symbol }: FiatAmountProps) => {
    const fiatValue = useSelector((state: AssetsRootState) => selectAssetFiatValue(state, symbol));

    return <BaseCurrencyAmountFormatter symbol={symbol} value={fiatValue} />;
});

FiatAmount.displayName = 'FiatAmount';
