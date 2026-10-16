import { type MessageSystemRootState } from '@suite-common/message-system';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type AccountsRootState } from '@suite-common/wallet-core';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';

import {
    type CoinjoinRootState,
    selectIsMixingEnabled,
    selectIsMixingEnabledByAccountKey,
} from './coinjoinSelectors';
import { getCoinjoinConfig } from './config';

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
