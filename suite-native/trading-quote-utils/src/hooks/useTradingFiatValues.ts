import { type NetworksRootState, selectNetworkConfigDeps } from '@suite-common/networks';
import { useServices } from '@suite-common/dependency-injection';
import { useSelector } from 'react-redux';

import type { CryptoId } from 'invity-api';

import {
    cryptoIdToNetworkSymbol,
    useTradingFiatValues as useCommonTradingFiatValues,
} from '@suite-common/trading';
import {
    type WalletSettingsRootState,
    selectBaseCurrency,
    selectIsAmountInSats,
} from '@suite-common/wallet-core';
import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

export const useTradingFiatValues = (
    amount: string | undefined,
    cryptoId: CryptoId | undefined,
) => {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);

    const symbol = cryptoIdToNetworkSymbol(networkConfigDeps, cryptoId);
    const shouldSendInSats = useSelector((state: WalletSettingsRootState & NetworksRootState) =>
        selectIsAmountInSats(state, symbol),
    );
    const fiatCurrency = useSelector(selectBaseCurrency);

    const ret = useCommonTradingFiatValues({
        shouldSendInSats,
        fiatCurrency,
        cryptoId,
        amount,
    });

    if (!ret) {
        return null;
    }

    const { fiatValue } = ret;

    return {
        ...ret,
        baseCurrencyAmount: fiatValue ? asBaseCurrencyAmount(new BigNumber(fiatValue)) : undefined,
    };
};
