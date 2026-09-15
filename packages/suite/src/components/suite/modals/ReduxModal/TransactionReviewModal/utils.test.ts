import { type StakeState, type YieldTxReviewState } from '@suite-common/wallet-core';
import { type FormState } from '@suite-common/wallet-types';

import { getTxType } from './utils';

const sendState = {} as YieldTxReviewState;
const stakeState = { data: {} } as unknown as StakeState;

const formState = (overrides: Partial<FormState> = {}) =>
    ({ outputs: [], options: [], ...overrides }) as unknown as FormState;

describe('getTxType', () => {
    it('reports a plain send as undefined', () => {
        expect(getTxType(sendState, formState(), false)).toBeUndefined();
    });

    it('reports staking transactions as stake', () => {
        expect(getTxType(stakeState, formState(), false)).toBe('stake');
    });

    it('reports trading transactions as trade', () => {
        expect(
            getTxType(
                sendState,
                formState({ trading: { activeSection: 'exchange' } as never }),
                false,
            ),
        ).toBe('trade');
    });

    it('reports every transaction of a yield flow as yield', () => {
        expect(getTxType(sendState, formState(), true)).toBe('yield');
    });

    it('prefers stake and trade over the yield flow', () => {
        expect(getTxType(stakeState, formState(), true)).toBe('stake');
        expect(
            getTxType(
                sendState,
                formState({ trading: { activeSection: 'exchange' } as never }),
                true,
            ),
        ).toBe('trade');
    });
});
