import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type WalletSettingsRootState, selectIsAmountInSats } from '@suite-common/wallet-core';

export const useCryptoAmountMaxDecimals = (
    symbol: NetworkSymbol | undefined,
    decimals: number | undefined,
) => {
    const isAmountInSats = useSelector((state: WalletSettingsRootState) =>
        selectIsAmountInSats(state, symbol),
    );

    return isAmountInSats ? 0 : decimals;
};
