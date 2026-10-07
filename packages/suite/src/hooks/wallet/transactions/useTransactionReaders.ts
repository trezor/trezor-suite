import { useMemo } from 'react';

import { isPhishingTransaction } from '@suite-common/token-definitions';
import {
    selectActiveDustPhishingThreshold,
    selectBlockchainHeightBySymbol,
    selectPhishingTransactionsContext,
} from '@suite-common/wallet-core';
import type { AccountKey, WalletAccountTransaction } from '@suite-common/wallet-types';
import { getConfirmations } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';

import { useHistoricFiatRates } from './HistoricFiatRatesContext';

/** Confirmations of a transaction at the current height of its network. */
export const useTransactionConfirmations = (transaction: WalletAccountTransaction) => {
    const blockHeight = useSelector(state =>
        selectBlockchainHeightBySymbol(state, transaction.symbol),
    );

    return getConfirmations(transaction, blockHeight);
};

/**
 * Whether a transaction looks like phishing. Reads the transaction it is given, so it works for
 * transactions from any source, valued at the past rates the view renders with.
 */
export const usePhishingResult = (
    transaction: WalletAccountTransaction,
    accountKey: AccountKey,
) => {
    const { tokenDefinitions, txsMarkedAsNotScam } = useSelector(state =>
        selectPhishingTransactionsContext(state, accountKey, transaction.symbol),
    );
    const historicRates = useHistoricFiatRates();
    const dustThreshold = useSelector(selectActiveDustPhishingThreshold);

    return useMemo(
        () =>
            isPhishingTransaction({
                transaction,
                tokenDefinitions,
                txsMarkedAsNotScam,
                historicRates,
                dustThreshold,
            }),
        [transaction, tokenDefinitions, txsMarkedAsNotScam, historicRates, dustThreshold],
    );
};
