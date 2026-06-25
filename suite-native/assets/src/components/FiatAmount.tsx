import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { BaseCurrencyAmountFormatter } from '@suite-native/formatters';
import { BigNumber } from '@trezor/utils';

import { selectAssetFiatValue } from '../assetsSelectors';
import { type AssetsRootState } from '../types';

type FiatAmountProps = { symbol: NetworkSymbol };

export const FiatAmount = ({ symbol }: FiatAmountProps) => {
    const fiatValue = useSelector((state: AssetsRootState) => selectAssetFiatValue(state, symbol));

    return (
        <BaseCurrencyAmountFormatter
            symbol={symbol}
            value={fiatValue !== null ? asBaseCurrencyAmount(new BigNumber(fiatValue)) : null}
        />
    );
};
