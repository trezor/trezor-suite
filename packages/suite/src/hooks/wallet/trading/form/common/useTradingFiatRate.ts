import { useSelector } from 'react-redux';

import { type TokenAddress } from '@suite-common/tokens';
import { CONTRACT_ADDRESS_FOR_NATIVE_TOKEN } from '@suite-common/trading';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type FiatRatesRootState,
    type WalletSettingsRootState,
    selectBaseCurrency,
    selectFiatRatesByFiatRateKey,
} from '@suite-common/wallet-core';
import { getFiatRateKey } from '@suite-common/wallet-utils';

type UseTradingFiatRateParams = {
    symbol: NetworkSymbol | undefined;
    tokenAddress: TokenAddress | null | undefined;
};

export const useTradingFiatRate = ({ symbol, tokenAddress }: UseTradingFiatRateParams) =>
    useSelector((state: FiatRatesRootState & WalletSettingsRootState) => {
        if (!symbol) {
            return undefined;
        }

        const isNativeToken = !tokenAddress || tokenAddress === CONTRACT_ADDRESS_FOR_NATIVE_TOKEN;

        return selectFiatRatesByFiatRateKey(
            state,
            getFiatRateKey(
                symbol,
                selectBaseCurrency(state),
                isNativeToken ? undefined : tokenAddress,
            ),
            'current',
        )?.rate;
    });
