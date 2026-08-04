import { useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { selectGetNetworkConfigDep } from '@suite-common/networks';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { isTestnet } from '@suite-common/wallet-utils';
import { isNotNullOrUndefined } from '@trezor/utils';

import { selectBaseCurrency } from './walletSettingsReducer';

export const useDisplayBaseCurrency = (symbol: NetworkSymbol | undefined | null) => {
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const networkConfigDeps = useServices(selectGetNetworkConfigDep);

    return {
        shallDisplayBaseCurrency:
            isNotNullOrUndefined(symbol) &&
            !isTestnet(networkConfigDeps, symbol) &&
            baseCurrencyCode !== symbol,
    };
};
