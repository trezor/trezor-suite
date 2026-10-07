import {
    type ChainNetwork,
    type FiatRate,
    getChainSyncPolicy,
    getDisplayBalanceFiatValue,
} from '@trezor/network-module-suite-common-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

type FakeChainNetworkParams = {
    symbol: NetworkSymbol;
    /** Display balance by descriptor. */
    balances: Record<string, string>;
    rate: FiatRate | null;
};

/** A network answering from memory, with spies on what shared code asks it. */
export const createFakeChainNetwork = (params: FakeChainNetworkParams) => {
    const getAccountBalance = jest.fn<
        ReturnType<ChainNetwork['getAccountBalance']>,
        Parameters<ChainNetwork['getAccountBalance']>
    >(({ ref }) => {
        const displayBalance = params.balances[ref.descriptor] ?? '0';

        return Promise.resolve({
            balance: displayBalance,
            availableBalance: displayBalance,
            displayBalance,
            empty: displayBalance === '0',
        });
    });
    const getNativeFiatRate = jest.fn<
        ReturnType<ChainNetwork['getNativeFiatRate']>,
        Parameters<ChainNetwork['getNativeFiatRate']>
    >(() => Promise.resolve(params.rate));

    const network: ChainNetwork = {
        symbol: params.symbol,
        backendType: 'blockbook',
        syncPolicy: getChainSyncPolicy(60_000),
        getAccountBalance,
        getNativeFiatRate,
        getAccountFiatBalance: getDisplayBalanceFiatValue,
    };

    return { network, getAccountBalance, getNativeFiatRate };
};
