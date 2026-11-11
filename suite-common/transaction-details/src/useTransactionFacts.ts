import { useMemo } from 'react';

import { injectGetNetwork } from '@suite-common/networks';
import type { WalletAccountTransaction } from '@suite-common/wallet-types';
import { useGetter } from '@trezor/dependency-injection';
import type { AccountType } from '@trezor/network-module-suite-common-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

import { type TransactionFacts, getTransactionFacts } from './getTransactionFacts';

type UseTransactionFactsParams = {
    /** Which network the transaction is on; the backend is the one serving it right now. */
    readonly network: { readonly symbol: NetworkSymbol; readonly accountType?: AccountType };
    readonly transaction: WalletAccountTransaction;
    readonly isConfirmed: boolean;
};

/**
 * The network-specific facts about a transaction, for the network as its backend serves it right
 * now. Any UI renders from this: the default list, a family's override, a native screen.
 */
export const useTransactionFacts = ({
    network: { symbol, accountType },
    transaction,
    isConfirmed,
}: UseTransactionFactsParams): TransactionFacts | undefined => {
    const network = useGetter(injectGetNetwork, { symbol, accountType });

    return useMemo(
        () => getTransactionFacts({ network, transaction, isConfirmed }),
        [network, transaction, isConfirmed],
    );
};
