import { type Action } from '@reduxjs/toolkit';

import { type SuiteSettingsRootState } from '@suite/settings';
import { REDACTED_REPLACEMENT } from '@suite-common/logger';

// redux-logger and the Redux DevTools extension print every action and the whole state. The wardd
// pairing token is a credential: it is set through an action payload and kept in the debug
// settings, so both are redacted before printing. The DevTools sanitizers are typed for any action
// and state, so the shapes are checked at runtime.

const hasWarddToken = (payload: unknown): payload is { warddToken?: string } =>
    typeof payload === 'object' && payload !== null && 'warddToken' in payload;

const hasSuiteSettings = (state: unknown): state is SuiteSettingsRootState =>
    typeof state === 'object' && state !== null && 'suiteSettings' in state;

export const redactLoggedAction = <A extends Action>(action: A): A =>
    'payload' in action && hasWarddToken(action.payload)
        ? { ...action, payload: { ...action.payload, warddToken: REDACTED_REPLACEMENT } }
        : action;

export const redactLoggedState = <State>(state: State): State =>
    !hasSuiteSettings(state) || state.suiteSettings.debug.warddToken === undefined
        ? state
        : {
              ...state,
              suiteSettings: {
                  ...state.suiteSettings,
                  debug: { ...state.suiteSettings.debug, warddToken: REDACTED_REPLACEMENT },
              },
          };
