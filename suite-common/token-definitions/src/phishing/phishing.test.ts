import { mockNetworkConfigDeps } from '@suite-common/networks/mocks';

import {
    isDustValuePhishingFixtures,
    isFakeTokenPhishingFixtures,
    isPhishingTransactionFixtures,
    isUnknownTxPhishingFixtures,
    isZeroValuePhishingFixtures,
} from './__fixtures__/phishing';
import { DUST_PHISHING_THRESHOLD } from './constants';
import { detectors } from './detectors';
import { isPhishingTransaction } from './phishing';

const networkConfigDeps = mockNetworkConfigDeps();

describe('isDustValuePhishing', () => {
    isDustValuePhishingFixtures.forEach(({ testName, transaction, result }) => {
        test(testName, () => {
            expect(
                detectors(networkConfigDeps).dustValue.validator({
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
            expect(
                detectors(networkConfigDeps).zeroValue.validator({ transaction }).isPhishing,
            ).toBe(result);
        });
    });
});

describe('isFakeTokenPhishing', () => {
    isFakeTokenPhishingFixtures.forEach(({ testName, transaction, tokenDefinitions, result }) => {
        test(testName, () => {
            expect(
                detectors(networkConfigDeps).fakeToken.validator({ transaction, tokenDefinitions })
                    .isPhishing,
            ).toBe(result);
        });
    });
});

describe('isUnknownTxPhishing', () => {
    isUnknownTxPhishingFixtures.forEach(({ testName, transaction, result }) => {
        test(testName, () => {
            expect(
                detectors(networkConfigDeps).unknownTx.validator({ transaction }).isPhishing,
            ).toBe(result);
        });
    });
});

describe('isPhishingTransaction', () => {
    isPhishingTransactionFixtures.forEach(({ testName, transaction, tokenDefinitions, result }) => {
        test(testName, () => {
            expect(
                isPhishingTransaction(networkConfigDeps, {
                    transaction,
                    tokenDefinitions,
                    txsMarkedAsNotScam: [],
                    dustThreshold: DUST_PHISHING_THRESHOLD,
                }).isPhishing,
            ).toBe(result);
        });
    });
});
