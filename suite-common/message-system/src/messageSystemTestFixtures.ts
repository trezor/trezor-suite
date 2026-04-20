import { type Action, type Localization } from '@suite-common/suite-types';

import { messageSystemInitialState } from './messageSystemReducer';
import { type MessageSystemState } from './messageSystemTypes';

const EMPTY_LOCALIZATION: Localization = {
    en: '',
    es: '',
    cs: '',
    de: '',
    fr: '',
    pt: '',
};

/**
 * Build a feature-flag action keyed by the supplied domain map. Used to flip
 * `selectIsFeatureEnabled(state, domain)` reads from tests without hand-rolling
 * the full `Action`/`Message` shape at each call site.
 */
const featureFlagAction = (id: string, flags: Record<string, boolean>): Action => ({
    conditions: [{}],
    message: {
        id,
        priority: 1,
        dismissible: false,
        variant: 'info',
        category: 'feature',
        content: EMPTY_LOCALIZATION,
        feature: Object.entries(flags).map(([domain, flag]) => ({ domain, flag })),
    },
});

const FEATURE_FLAG_ACTION_ID = 'test-feature-flags-action';

/**
 * Build a message-system state fragment that toggles feature-flag selectors
 * (e.g. `selectIsTradingBuyEnabled`) by writing a single feature-category action
 * whose `feature[]` entries come from `flags`.
 *
 * @example
 *   overrides: {
 *       messageSystem: messageSystemStateWithFeatureFlags({
 *           'trading.buy': false,
 *           'trading.sell': false,
 *       }),
 *   }
 */
export const messageSystemStateWithFeatureFlags = (
    flags: Record<string, boolean>,
): MessageSystemState => ({
    ...messageSystemInitialState,
    validMessages: {
        ...messageSystemInitialState.validMessages,
        feature: [FEATURE_FLAG_ACTION_ID],
    },
    config: {
        version: 1,
        timestamp: '1970-01-01T00:00:00Z',
        sequence: 1,
        actions: [featureFlagAction(FEATURE_FLAG_ACTION_ID, flags)],
    },
});
