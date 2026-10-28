import type { SearchAccountLabels } from '@suite-common/transaction-search';
import { type TransactionSearch, parseTransactionSearch } from '@suite-common/transaction-store';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import { isNativeDisplaySymbolSearch } from '@suite-common/wallet-utils';

export type ToTransactionSearchParams = {
    query: string;
    symbol: NetworkSymbol;
    labels: SearchAccountLabels;
};

/**
 * The list's search query for the store, with what only the app knows filled in: which
 * transactions and addresses have a label containing each term, and whether a term is the
 * network's symbol. The labels stay here; the store gets only the matching txids and addresses.
 */
export const toTransactionSearch = ({
    query,
    symbol,
    labels,
}: ToTransactionSearchParams): TransactionSearch | null =>
    parseTransactionSearch(query, text => ({
        labelTxids: [...labels.outputLabels]
            .filter(([, outputLabels]) =>
                [...outputLabels.values()].some(label => label.toLowerCase().includes(text)),
            )
            .map(([txid]) => txid),
        labelAddresses: [...labels.addressLabels]
            .filter(([, label]) => label.toLowerCase().includes(text))
            .map(([address]) => address),
        isNativeSymbol: isNativeDisplaySymbolSearch(symbol, text),
    }));
