import { suiteSettingsActions, suiteSettingsInitialState } from '@suite/settings';

import { redactLoggedAction, redactLoggedState } from './reduxLoggerRedaction';

const TOKEN = 'wardd-pairing-token';

describe('redactLoggedAction', () => {
    it('hides the wardd token in an action payload', () => {
        const action = suiteSettingsActions.setDebugMode({ warddToken: TOKEN });

        expect(JSON.stringify(redactLoggedAction(action))).not.toContain(TOKEN);
        expect(redactLoggedAction(action)).toEqual({
            ...action,
            payload: { warddToken: '[redacted]' },
        });
        expect(action.payload.warddToken).toBe(TOKEN);
    });

    it('leaves other actions as they are', () => {
        const action = suiteSettingsActions.setDebugMode({ warddUrl: 'ws://127.0.0.1:21329' });

        expect(redactLoggedAction(action)).toBe(action);
    });
});

describe('redactLoggedState', () => {
    it('hides the stored wardd token and keeps the rest of the state', () => {
        const state = {
            suiteSettings: {
                ...suiteSettingsInitialState,
                debug: { ...suiteSettingsInitialState.debug, warddToken: TOKEN },
            },
        };

        const redacted = redactLoggedState(state);

        expect(JSON.stringify(redacted)).not.toContain(TOKEN);
        expect(redacted.suiteSettings.debug).toEqual({
            ...suiteSettingsInitialState.debug,
            warddToken: '[redacted]',
        });
        expect(state.suiteSettings.debug.warddToken).toBe(TOKEN);
    });

    it('returns the state as it is without a token', () => {
        const state = { suiteSettings: suiteSettingsInitialState };

        expect(redactLoggedState(state)).toBe(state);
    });

    it('returns a state without suite settings as it is', () => {
        const state = { wallet: { accounts: [] } };

        expect(redactLoggedState(state)).toBe(state);
    });
});
