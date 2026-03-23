import {
    type NetworkSymbol,
    type NetworkType,
    getNetworkFeatures,
    getNetworkType,
} from '@suite-common/wallet-config';
import { type RatesByTimestamps, type WalletAccountTransaction } from '@suite-common/wallet-types';

import { type TokenDefinitions } from '../tokenDefinitionsTypes';
import { detectors } from './detectors';
import { getTransactionWithFiatAmounts } from './utils';
import { PhishingTransactionValidator } from './validator';

type NetworkPhishingValidators = Map<NetworkType, PhishingTransactionValidator>;

const PHISHING_VALIDATORS: NetworkPhishingValidators = new Map([
    [
        'ethereum',
        new PhishingTransactionValidator()
            .addDetector(detectors.fakeToken)
            .addDetector(detectors.dustValue)
            .addDetector(detectors.zeroValue),
    ],
    ['ripple', new PhishingTransactionValidator().addDetector(detectors.dustValue)],
    [
        'cardano',
        new PhishingTransactionValidator()
            .addDetector(detectors.fakeToken)
            .addDetector(detectors.dustValue),
    ],
    [
        'solana',
        new PhishingTransactionValidator()
            .addDetector(detectors.fakeToken)
            .addDetector(detectors.dustValue),
    ],
    [
        'stellar',
        new PhishingTransactionValidator()
            .addDetector(detectors.unknownTx)
            .addDetector(detectors.fakeToken)
            .addDetector(detectors.dustValue),
    ],
    [
        'tron',
        new PhishingTransactionValidator()
            .addDetector(detectors.fakeToken)
            .addDetector(detectors.dustValue),
    ],
]);

// NOTE: This function determines for which symbols there are filters in the UI to hide/display spam transactions
// when handling fraud for other symbols, make sure this function is updated!
export const hasNetworkPotentialFraudTransactions = (symbol: NetworkSymbol) =>
    PHISHING_VALIDATORS.has(getNetworkType(symbol));

interface IsPhishingTransactionProps {
    transaction?: WalletAccountTransaction;
    tokenDefinitions?: TokenDefinitions;
    historicRates?: RatesByTimestamps;
    txsMarkedAsNotScam: string[];
    dustThreshold?: string;
}

/** This is the single main function that is used across Suite to determine if a transaction is phishing */
export const isPhishingTransaction = ({
    transaction,
    tokenDefinitions,
    historicRates,
    txsMarkedAsNotScam,
    dustThreshold,
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
    const validator = PHISHING_VALIDATORS.get(networkType);

    if (!validator || validator.getDetectors().length === 0) return false;

    return validator
        .setTransaction(transactionWithFiatAmounts)
        .setTokenDefinitions(tokenDefinitions)
        .setDustThreshold(dustThreshold)
        .validate();
};
