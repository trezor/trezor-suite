import { type NetworkConfigDeps } from '@suite-common/networks';
import {
    type NetworkSymbol,
    type NetworkType,
    getNetworkFeatures,
    getNetworkType,
} from '@suite-common/wallet-config';
import { type RatesByTimestamps, type WalletAccountTransaction } from '@suite-common/wallet-types';

import { type TokenDefinitions } from '../tokenDefinitionsTypes';
import { detectors } from './detectors';
import { createPhishingResult, getTransactionWithFiatAmounts } from './utils';
import { PhishingTransactionValidator } from './validator';

type NetworkPhishingValidators = Map<NetworkType, PhishingTransactionValidator>;

const PHISHING_VALIDATORS = (networkConfigDeps: NetworkConfigDeps): NetworkPhishingValidators =>
    new Map([
        [
            'bitcoin',
            new PhishingTransactionValidator()
                .addDetector(detectors(networkConfigDeps).dustValue)
                .addDetector(detectors(networkConfigDeps).zeroValue),
        ],
        [
            'ethereum',
            new PhishingTransactionValidator()
                .addDetector(detectors(networkConfigDeps).fakeToken)
                .addDetector(detectors(networkConfigDeps).dustValue)
                .addDetector(detectors(networkConfigDeps).zeroValue),
        ],
        [
            'ripple',
            new PhishingTransactionValidator().addDetector(detectors(networkConfigDeps).dustValue),
        ],
        [
            'cardano',
            new PhishingTransactionValidator()
                .addDetector(detectors(networkConfigDeps).fakeToken)
                .addDetector(detectors(networkConfigDeps).dustValue),
        ],
        [
            'solana',
            new PhishingTransactionValidator()
                .addDetector(detectors(networkConfigDeps).fakeToken)
                .addDetector(detectors(networkConfigDeps).dustValue),
        ],
        [
            'stellar',
            new PhishingTransactionValidator()
                .addDetector(detectors(networkConfigDeps).unknownTx)
                .addDetector(detectors(networkConfigDeps).fakeToken)
                .addDetector(detectors(networkConfigDeps).dustValue),
        ],
        [
            'tron',
            new PhishingTransactionValidator()
                .addDetector(detectors(networkConfigDeps).trc10)
                .addDetector(detectors(networkConfigDeps).fakeToken)
                .addDetector(detectors(networkConfigDeps).dustValue),
        ],
    ]);

// NOTE: This function determines for which symbols there are filters in the UI to hide/display spam transactions
// when handling fraud for other symbols, make sure this function is updated!
export const hasNetworkPotentialFraudTransactions = (
    networkConfigDeps: NetworkConfigDeps,
    symbol: NetworkSymbol,
) => PHISHING_VALIDATORS(networkConfigDeps).has(getNetworkType(networkConfigDeps, symbol));

interface IsPhishingTransactionProps {
    transaction?: WalletAccountTransaction;
    tokenDefinitions?: TokenDefinitions;
    historicRates?: RatesByTimestamps;
    txsMarkedAsNotScam: string[];
    dustThreshold?: string;
}

/** This is the single main function that is used across Suite to determine if a transaction is phishing */
export const isPhishingTransaction = (
    networkConfigDeps: NetworkConfigDeps,
    {
        transaction,
        tokenDefinitions,
        historicRates,
        txsMarkedAsNotScam,
        dustThreshold,
    }: IsPhishingTransactionProps,
) => {
    if (!transaction) return createPhishingResult(false);

    const { symbol } = transaction;
    const networkFeatures = getNetworkFeatures(networkConfigDeps, symbol);
    const hasCoinDefinitionsFeature = networkFeatures.includes('coin-definitions');

    if (!tokenDefinitions && hasCoinDefinitionsFeature) return createPhishingResult(false);
    if (txsMarkedAsNotScam.includes(transaction.txid)) return createPhishingResult(false);

    const transactionWithFiatAmounts = getTransactionWithFiatAmounts(networkConfigDeps, {
        transaction,
        historicRates,
    });

    const networkType = getNetworkType(networkConfigDeps, transactionWithFiatAmounts.symbol);
    const validator = PHISHING_VALIDATORS(networkConfigDeps).get(networkType);

    if (!validator || validator.getDetectors().length === 0) return createPhishingResult(false);

    return validator
        .setTransaction(transactionWithFiatAmounts)
        .setTokenDefinitions(tokenDefinitions)
        .setDustThreshold(dustThreshold)
        .validate();
};
