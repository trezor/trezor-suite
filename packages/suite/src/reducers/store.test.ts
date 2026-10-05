import '@suite-common/test-utils/globalOverrides';

import { redactLoggedAction, redactLoggedState } from 'src/utils/suite/reduxLoggerRedaction';

import { reduxDevToolsOptions, reduxLoggerOptions } from './store';

describe('store debugging tools', () => {
    // Both print every action and the whole state, which carry the wardd pairing token.
    it('redacts what redux-logger and the Redux DevTools extension print', () => {
        expect(reduxLoggerOptions).toMatchObject({
            actionTransformer: redactLoggedAction,
            stateTransformer: redactLoggedState,
        });
        expect(reduxDevToolsOptions).toMatchObject({
            actionSanitizer: redactLoggedAction,
            stateSanitizer: redactLoggedState,
        });
    });
});
