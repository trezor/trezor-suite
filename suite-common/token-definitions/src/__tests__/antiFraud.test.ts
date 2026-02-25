import {
    isDustValuePhishingFixtures,
    isFakeTokenPhishingFixtures,
    isPhishingTransactionFixtures,
    isUnknownTxPhishingFixtures,
    isZeroValuePhishingFixtures,
} from '../__fixtures__/antiFraud';
import {
    isDustValuePhishing,
    isFakeTokenPhishing,
    isPhishingTransaction,
    isUnknownTxPhishing,
    isZeroValuePhishing,
} from '../antiFraud';

describe('isDustValuePhishing', () => {
    isDustValuePhishingFixtures.forEach(({ testName, transaction, result }) => {
        test(testName, () => {
            expect(isDustValuePhishing({ transaction })).toBe(result);
        });
    });
});

describe('isZeroValuePhishing', () => {
    isZeroValuePhishingFixtures.forEach(({ testName, transaction, result }) => {
        test(testName, () => {
            expect(isZeroValuePhishing({ transaction })).toBe(result);
        });
    });
});

describe('isFakeTokenPhishing', () => {
    isFakeTokenPhishingFixtures.forEach(({ testName, transaction, tokenDefinitions, result }) => {
        test(testName, () => {
            expect(isFakeTokenPhishing({ transaction, tokenDefinitions })).toBe(result);
        });
    });
});

describe('isUnknownTxPhishing', () => {
    isUnknownTxPhishingFixtures.forEach(({ testName, transaction, result }) => {
        test(testName, () => {
            expect(isUnknownTxPhishing({ transaction })).toBe(result);
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
                }),
            ).toBe(result);
        });
    });
});
