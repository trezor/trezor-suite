import {
    getTransactionWithFiatAmountsFixtures,
    isDustValuePhishingFixtures,
    isFakeTokenPhishingFixtures,
    isPhishingTransactionFixtures,
    isUnknownTxPhishingFixtures,
    isZeroValuePhishingFixtures,
} from './__fixtures__/phishing';
import { DUST_PHISHING_THRESHOLD } from './constants';
import { detectors } from './detectors';
import { isPhishingTransaction } from './phishing';
import { getTransactionWithFiatAmounts } from './utils';

describe('isDustValuePhishing', () => {
    isDustValuePhishingFixtures.forEach(({ testName, transaction, result }) => {
        test(testName, () => {
            expect(
                detectors.dustValue.validator({
                    transaction,
                    dustThreshold: DUST_PHISHING_THRESHOLD,
                }).isPhishing,
            ).toBe(result);
        });
    });
});

describe('isZeroValuePhishing', () => {
    isZeroValuePhishingFixtures.forEach(({ testName, transaction, result }) => {
        test(testName, () => {
            expect(detectors.zeroValue.validator({ transaction }).isPhishing).toBe(result);
        });
    });
});

describe('isFakeTokenPhishing', () => {
    isFakeTokenPhishingFixtures.forEach(({ testName, transaction, tokenDefinitions, result }) => {
        test(testName, () => {
            expect(
                detectors.fakeToken.validator({ transaction, tokenDefinitions }).isPhishing,
            ).toBe(result);
        });
    });
});

describe('isUnknownTxPhishing', () => {
    isUnknownTxPhishingFixtures.forEach(({ testName, transaction, result }) => {
        test(testName, () => {
            expect(detectors.unknownTx.validator({ transaction }).isPhishing).toBe(result);
        });
    });
});

describe('isPhishingTransaction', () => {
    isPhishingTransactionFixtures.forEach(({ testName, transaction, tokenDefinitions, result }) => {
        test(testName, () => {
            expect(
                isPhishingTransaction({
                    transaction,
                    tokenDefinitions,
                    txsMarkedAsNotScam: [],
                    dustThreshold: DUST_PHISHING_THRESHOLD,
                }).isPhishing,
            ).toBe(result);
        });
    });
});

describe('getTransactionWithFiatAmounts', () => {
    getTransactionWithFiatAmountsFixtures.forEach(
        ({ testName, transaction, historicRates, tokenAmountInFiat }) => {
            test(testName, () => {
                expect(
                    getTransactionWithFiatAmounts({ transaction, historicRates }).tokens[0]
                        ?.amountInFiat,
                ).toBe(tokenAmountInFiat);
            });
        },
    );
});
