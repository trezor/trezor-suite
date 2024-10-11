import {
    getIsFakeTokenPhishingFixtures,
    getIsZeroValuePhishingFixtures,
    getIsPhishingTransactionFixtures,
} from '../__fixtures__/antiFraud';
import {
    getIsFakeTokenPhishing,
    getIsPhishingTransaction,
    getIsZeroValuePhishing,
} from '../antiFraud';

describe('getIsZeroValuePhishing', () => {
    getIsZeroValuePhishingFixtures.forEach(({ testName, transaction, result }) => {
        test(testName, () => {
            expect(getIsZeroValuePhishing(transaction)).toBe(result);
        });
    });
});

describe('getIsFakeTokenPhishing', () => {
    getIsFakeTokenPhishingFixtures.forEach(
        ({ testName, transaction, tokenDefinitions, result }) => {
            test(testName, () => {
                expect(getIsFakeTokenPhishing(transaction, tokenDefinitions)).toBe(result);
            });
        },
    );
});

describe('getIsPhishingTransaction', () => {
    getIsPhishingTransactionFixtures.forEach(
        ({ testName, transaction, tokenDefinitions, result }) => {
            test(testName, () => {
                expect(getIsPhishingTransaction(transaction, tokenDefinitions)).toBe(result);
            });
        },
    );
});
