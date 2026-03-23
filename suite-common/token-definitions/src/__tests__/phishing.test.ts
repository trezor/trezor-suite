import {
    isDustValuePhishingFixtures,
    isFakeTokenPhishingFixtures,
    isPhishingTransactionFixtures,
    isUnknownTxPhishingFixtures,
    isZeroValuePhishingFixtures,
} from '../__fixtures__/phishing';
import { isPhishingTransaction } from '../phishing';
import { DUST_PHISHING_THRESHOLD } from '../phishing/constants';
import { detectors } from '../phishing/detectors';

describe('isDustValuePhishing', () => {
    isDustValuePhishingFixtures.forEach(({ testName, transaction, result }) => {
        test(testName, () => {
            expect(
                detectors.dustValue({ transaction, dustThreshold: DUST_PHISHING_THRESHOLD })
                    .isPhishing,
            ).toBe(result);
        });
    });
});

describe('isZeroValuePhishing', () => {
    isZeroValuePhishingFixtures.forEach(({ testName, transaction, result }) => {
        test(testName, () => {
            expect(detectors.zeroValue({ transaction }).isPhishing).toBe(result);
        });
    });
});

describe('isFakeTokenPhishing', () => {
    isFakeTokenPhishingFixtures.forEach(({ testName, transaction, tokenDefinitions, result }) => {
        test(testName, () => {
            expect(detectors.fakeToken({ transaction, tokenDefinitions }).isPhishing).toBe(result);
        });
    });
});

describe('isUnknownTxPhishing', () => {
    isUnknownTxPhishingFixtures.forEach(({ testName, transaction, result }) => {
        test(testName, () => {
            expect(detectors.unknownTx({ transaction }).isPhishing).toBe(result);
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
                }),
            ).toBe(result);
        });
    });
});
