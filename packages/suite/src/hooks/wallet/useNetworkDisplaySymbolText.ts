import { useSelector } from 'react-redux';

import { type NetworksRootState, selectNetworkDisplaySymbol } from '@suite-common/networks';
import { type NetworkSymbol } from '@suite-common/wallet-config';

/**
 * The symbol of a network's coin as plain text, for APIs that take only a string, such as
 * react-hook-form validation messages or the window title. Everywhere else, render `AssetSymbol`.
 */
export const useNetworkDisplaySymbolText = (networkSymbol: NetworkSymbol | undefined) =>
    useSelector((state: NetworksRootState) =>
        networkSymbol ? (selectNetworkDisplaySymbol(state, networkSymbol) ?? '') : '',
    );
