import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type WalletSettingsRootState,
    selectIsAmountInSats,
    selectIsBaseCurrencyInSats,
} from '@suite-common/wallet-core';
import { decimalTransformer, integerTransformer } from '@trezor/utils';

export { decimalTransformer, integerTransformer } from '@trezor/utils';

export const useAmountInputTransformers = (symbol: NetworkSymbol | undefined) => {
    const isAmountInSats = useSelector((state: WalletSettingsRootState) =>
        selectIsAmountInSats(state, symbol),
    );
    const isBaseCurrencyInSats = useSelector(selectIsBaseCurrencyInSats);

    return {
        cryptoAmountTransformer: isAmountInSats ? integerTransformer : decimalTransformer,
        fiatAmountTransformer: isBaseCurrencyInSats ? integerTransformer : decimalTransformer,
    };
};
