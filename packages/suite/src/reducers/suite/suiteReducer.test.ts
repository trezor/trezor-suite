import { STORAGE } from 'src/actions/suite/constants';
import { setSuspiciousTransactionsBlurringDisabled } from 'src/actions/suite/suiteActions';
import type { Action } from 'src/types/suite';

import suiteReducer from './suiteReducer';

describe('suiteReducer', () => {
    it('has suspicious transactions blurring enabled by default', () => {
        const state = suiteReducer(undefined, { type: 'foo' } as unknown as Action);

        expect(state.isSuspiciousTransactionsBlurringDisabled).toBe(false);
    });

    it('toggles suspicious transactions blurring', () => {
        const disabled = suiteReducer(undefined, setSuspiciousTransactionsBlurringDisabled(true));
        expect(disabled.isSuspiciousTransactionsBlurringDisabled).toBe(true);

        const enabled = suiteReducer(disabled, setSuspiciousTransactionsBlurringDisabled(false));
        expect(enabled.isSuspiciousTransactionsBlurringDisabled).toBe(false);
    });

    it('does not restore the blurring flag from storage', () => {
        const disabled = suiteReducer(undefined, setSuspiciousTransactionsBlurringDisabled(true));

        const state = suiteReducer(disabled, {
            type: STORAGE.LOAD,
            payload: {
                suiteSettings: {
                    isSuspiciousTransactionsBlurringDisabled: false,
                },
            },
        } as unknown as Action);

        expect(state.isSuspiciousTransactionsBlurringDisabled).toBe(true);
    });
});
