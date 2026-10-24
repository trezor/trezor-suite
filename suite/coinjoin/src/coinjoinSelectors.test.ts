import { type MessageSystemRootState } from '@suite-common/message-system';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type AccountsRootState, type TransactionsRootState } from '@suite-common/wallet-core';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';

import {
    type CoinjoinRootState,
    selectCoinjoinSpendingRestrictionByAccountKey,
    selectEffectiveTargetAnonymityByAccountKey,
    selectIsMixingEnabled,
    selectIsMixingEnabledByAccountKey,
} from './coinjoinSelectors';
import { DEFAULT_TARGET_ANONYMITY, getCoinjoinConfig } from './config';

type RestrictionState = AccountsRootState &
    CoinjoinRootState &
    MessageSystemRootState &
    TransactionsRootState;

const btcSymbol = asNetworkSymbol('btc');
const regtestSymbol = asNetworkSymbol('regtest');

const COORDINATOR_URL = 'https://coordinator.example/wabisabi/';
const privacyAccountKey = mockAccountKey({ descriptor: 'privacy' });
const COINJOIN_FEATURE_MESSAGE_ID = 'coinjoin-feature-flag';

type StateParams = {
    coinjoinConfigOverride?: Record<string, Record<string, string>>;
    isCoinjoinFeatureEnabled?: boolean;
};

const getState = ({ coinjoinConfigOverride, isCoinjoinFeatureEnabled }: StateParams = {}) =>
    ({
        messageSystem: {
            config: {
                actions: [
                    {
                        message: {
                            id: COINJOIN_FEATURE_MESSAGE_ID,
                            feature: [{ domain: 'coinjoin', flag: isCoinjoinFeatureEnabled }],
                        },
                    },
                ],
            },
            validMessages: {
                banner: [],
                context: [],
                modal: [],
                // The flag is only taken into account when the message is valid.
                feature:
                    isCoinjoinFeatureEnabled === undefined ? [] : [COINJOIN_FEATURE_MESSAGE_ID],
            },
            dismissedMessages: {},
        },
        wallet: {
            accounts: [{ key: privacyAccountKey, symbol: btcSymbol }],
            coinjoin: { debug: coinjoinConfigOverride ? { coinjoinConfigOverride } : undefined },
        },
        // The fixtures only carry what these selectors read.
    }) as unknown as AccountsRootState & CoinjoinRootState & MessageSystemRootState;

describe('selectIsMixingEnabled', () => {
    it('is disabled without a coordinator url override', () => {
        expect(selectIsMixingEnabled(getState(), btcSymbol)).toBe(false);
        expect(
            selectIsMixingEnabled(
                getState({ coinjoinConfigOverride: { btc: { middlewareUrl: COORDINATOR_URL } } }),
                btcSymbol,
            ),
        ).toBe(false);
    });

    it('is enabled by a coordinator url override of the same symbol only', () => {
        const state = getState({
            coinjoinConfigOverride: { btc: { coordinatorUrl: COORDINATOR_URL } },
        });

        expect(selectIsMixingEnabled(state, btcSymbol)).toBe(true);
        expect(selectIsMixingEnabled(state, regtestSymbol)).toBe(false);
    });

    it('ignores the coordinator configured for regtest, only an override counts', () => {
        // Regtest ships a localhost coordinator, which must not turn mixing on in dev builds.
        expect(getCoinjoinConfig(regtestSymbol).coordinatorUrl).toBeDefined();
        expect(selectIsMixingEnabled(getState(), regtestSymbol)).toBe(false);
    });

    it('stays disabled when the message system turns the feature off', () => {
        const coinjoinConfigOverride = { btc: { coordinatorUrl: COORDINATOR_URL } };

        expect(
            selectIsMixingEnabled(
                getState({ coinjoinConfigOverride, isCoinjoinFeatureEnabled: false }),
                btcSymbol,
            ),
        ).toBe(false);
        expect(
            selectIsMixingEnabled(
                getState({ coinjoinConfigOverride, isCoinjoinFeatureEnabled: true }),
                btcSymbol,
            ),
        ).toBe(true);
    });
});

describe('selectIsMixingEnabledByAccountKey', () => {
    const state = getState({
        coinjoinConfigOverride: { btc: { coordinatorUrl: COORDINATOR_URL } },
    });

    it('resolves the symbol from the account', () => {
        expect(selectIsMixingEnabledByAccountKey(state, privacyAccountKey)).toBe(true);
    });

    it('is disabled for an unknown or missing account', () => {
        expect(
            selectIsMixingEnabledByAccountKey(state, mockAccountKey({ descriptor: 'unknown' })),
        ).toBe(false);
        expect(selectIsMixingEnabledByAccountKey(state, null)).toBe(false);
    });
});

type RestrictionStateParams = {
    anonymitySet?: Record<string, number>;
    areSpendingRestrictionsEnabled?: boolean;
    hasCoordinatorOverride?: boolean;
    hasJointTransaction?: boolean;
    status?: string;
    targetAnonymity?: number;
    utxoAddresses?: string[];
};

const ADDRESS = 'bc1privacy';

const getRestrictionState = ({
    anonymitySet = { [ADDRESS]: 1 },
    areSpendingRestrictionsEnabled,
    hasCoordinatorOverride,
    hasJointTransaction,
    status = 'ready',
    targetAnonymity,
    utxoAddresses = [ADDRESS],
}: RestrictionStateParams = {}) =>
    ({
        ...getState(
            hasCoordinatorOverride
                ? { coinjoinConfigOverride: { btc: { coordinatorUrl: COORDINATOR_URL } } }
                : {},
        ),
        wallet: {
            accounts: [
                {
                    key: privacyAccountKey,
                    symbol: btcSymbol,
                    accountType: 'coinjoin',
                    backendType: 'coinjoin',
                    status,
                    addresses: { anonymitySet },
                    utxo: utxoAddresses.map(address => ({ address })),
                },
            ],
            coinjoin: {
                accounts: [
                    {
                        key: privacyAccountKey,
                        symbol: btcSymbol,
                        areSpendingRestrictionsEnabled,
                        setup: targetAnonymity === undefined ? undefined : { targetAnonymity },
                    },
                ],
                debug: hasCoordinatorOverride
                    ? { coinjoinConfigOverride: { btc: { coordinatorUrl: COORDINATOR_URL } } }
                    : undefined,
            },
            transactions: {
                transactions: {
                    [privacyAccountKey]: hasJointTransaction
                        ? [{ type: 'joint' }]
                        : [{ type: 'recv' }],
                },
            },
        },
        // The fixtures only carry what these selectors read.
    }) as unknown as RestrictionState;

describe('selectCoinjoinSpendingRestrictionByAccountKey', () => {
    it('leaves a never-mixed account with complete data unrestricted', () => {
        expect(
            selectCoinjoinSpendingRestrictionByAccountKey(getRestrictionState(), privacyAccountKey),
        ).toBe('unrestricted');
        // An account with no utxos has a complete anonymity set, not an unknown one.
        expect(
            selectCoinjoinSpendingRestrictionByAccountKey(
                getRestrictionState({ anonymitySet: {}, utxoAddresses: [] }),
                privacyAccountKey,
            ),
        ).toBe('unrestricted');
    });

    it('restricts an account that took part in a coinjoin', () => {
        expect(
            selectCoinjoinSpendingRestrictionByAccountKey(
                getRestrictionState({ hasJointTransaction: true }),
                privacyAccountKey,
            ),
        ).toBe('restricted');
        expect(
            selectCoinjoinSpendingRestrictionByAccountKey(
                getRestrictionState({ anonymitySet: { [ADDRESS]: 3 } }),
                privacyAccountKey,
            ),
        ).toBe('restricted');
    });

    it('blocks an account whose anonymity data is incomplete', () => {
        expect(
            selectCoinjoinSpendingRestrictionByAccountKey(
                getRestrictionState({ anonymitySet: {} }),
                privacyAccountKey,
            ),
        ).toBe('restricted-incomplete-data');
        expect(
            selectCoinjoinSpendingRestrictionByAccountKey(
                getRestrictionState({ status: 'initial' }),
                privacyAccountKey,
            ),
        ).toBe('restricted-incomplete-data');
    });

    it('lets the per-account override win in both directions', () => {
        expect(
            selectCoinjoinSpendingRestrictionByAccountKey(
                getRestrictionState({
                    areSpendingRestrictionsEnabled: false,
                    hasJointTransaction: true,
                }),
                privacyAccountKey,
            ),
        ).toBe('unrestricted');
        // The documented escape hatch out of the blocking state.
        expect(
            selectCoinjoinSpendingRestrictionByAccountKey(
                getRestrictionState({ areSpendingRestrictionsEnabled: false, anonymitySet: {} }),
                privacyAccountKey,
            ),
        ).toBe('unrestricted');
        expect(
            selectCoinjoinSpendingRestrictionByAccountKey(
                getRestrictionState({ areSpendingRestrictionsEnabled: true }),
                privacyAccountKey,
            ),
        ).toBe('restricted');
    });

    it('honours a target anonymity stored by the old slider', () => {
        expect(
            selectCoinjoinSpendingRestrictionByAccountKey(
                getRestrictionState({ targetAnonymity: 1, hasJointTransaction: true }),
                privacyAccountKey,
            ),
        ).toBe('unrestricted');
        expect(
            selectCoinjoinSpendingRestrictionByAccountKey(
                getRestrictionState({ targetAnonymity: 20 }),
                privacyAccountKey,
            ),
        ).toBe('restricted');
    });

    it('forces the restriction on while mixing is enabled', () => {
        expect(
            selectCoinjoinSpendingRestrictionByAccountKey(
                getRestrictionState({
                    hasCoordinatorOverride: true,
                    areSpendingRestrictionsEnabled: false,
                    targetAnonymity: 1,
                }),
                privacyAccountKey,
            ),
        ).toBe('restricted');
    });

    it('does not restrict a non-coinjoin or unknown account', () => {
        expect(selectCoinjoinSpendingRestrictionByAccountKey(getRestrictionState(), null)).toBe(
            'unrestricted',
        );
    });
});

describe('selectEffectiveTargetAnonymityByAccountKey', () => {
    it('reports 1 for an unrestricted account and the stored target otherwise', () => {
        expect(
            selectEffectiveTargetAnonymityByAccountKey(getRestrictionState(), privacyAccountKey),
        ).toBe(1);
        expect(
            selectEffectiveTargetAnonymityByAccountKey(
                getRestrictionState({ hasJointTransaction: true }),
                privacyAccountKey,
            ),
        ).toBe(DEFAULT_TARGET_ANONYMITY);
        expect(
            selectEffectiveTargetAnonymityByAccountKey(
                getRestrictionState({ hasJointTransaction: true, targetAnonymity: 10 }),
                privacyAccountKey,
            ),
        ).toBe(10);
    });

    it('is undefined for an account that is not a coinjoin account', () => {
        expect(
            selectEffectiveTargetAnonymityByAccountKey(getRestrictionState(), null),
        ).toBeUndefined();
    });
});
