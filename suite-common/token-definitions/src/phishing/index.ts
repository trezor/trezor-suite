import {
    NetworkSymbol,
    NetworkType,
    getNetworkFeatures,
    getNetworkType,
} from '@suite-common/wallet-config';
import { RatesByTimestamps, WalletAccountTransaction } from '@suite-common/wallet-types';

import { TokenDefinitions } from '../tokenDefinitionsTypes';
import { detectors } from './detectors';
import { PhishingDetectorFn } from './types';
import { getTransactionWithFiatAmounts } from './utils';

type NetworkPhishingDetectors = Map<NetworkType, PhishingDetectorFn[]>;

const PHISHING_DETECTORS: NetworkPhishingDetectors = new Map([
    ['ethereum', [detectors.dustValue, detectors.zeroValue, detectors.fakeToken]],
    ['ripple', [detectors.dustValue]],
    ['cardano', [detectors.dustValue, detectors.fakeToken]],
    ['solana', [detectors.dustValue, detectors.fakeToken]],
    ['stellar', [detectors.dustValue, detectors.fakeToken, detectors.unknownTx]],
    ['tron', [detectors.dustValue, detectors.fakeToken]],
]);

// NOTE: This function determines for which symbols there are filters in the UI to hide/display spam transactions
// when handling fraud for other symbols, make sure this function is updated!
export const hasNetworkPotentialFraudTransactions = (symbol: NetworkSymbol) =>
    PHISHING_DETECTORS.has(getNetworkType(symbol));

interface IsPhishingTransactionProps {
    transaction?: WalletAccountTransaction;
    tokenDefinitions?: TokenDefinitions;
    historicRates?: RatesByTimestamps;
    txsMarkedAsNotScam: string[];
}

/** This is the single main function that is used across Suite to determine if a transaction is phishing */
export const isPhishingTransaction = ({
    transaction,
    tokenDefinitions,
    historicRates,
    txsMarkedAsNotScam,
}: IsPhishingTransactionProps) => {
    if (!transaction) return false;

    const { symbol } = transaction;
    const networkFeatures = getNetworkFeatures(symbol);
    const hasCoinDefinitionsFeature = networkFeatures.includes('coin-definitions');

    if (!tokenDefinitions && hasCoinDefinitionsFeature) return false;
    if (txsMarkedAsNotScam.includes(transaction.txid)) return false;

    const transactionWithFiatAmounts = getTransactionWithFiatAmounts({
        transaction,
        historicRates,
    });

    const networkType = getNetworkType(transactionWithFiatAmounts.symbol);
    const networkDetectors = PHISHING_DETECTORS.get(networkType);

    if (!networkDetectors || networkDetectors.length === 0) return false;

    return networkDetectors.some(detector =>
        detector({ transaction: transactionWithFiatAmounts, tokenDefinitions }),
    );
};
