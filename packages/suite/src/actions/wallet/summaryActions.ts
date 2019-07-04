/* @flow */
import { SUMMARY } from '@wallet-actions/constants/';
import { Dispatch } from '@suite-types/index';
import { State, initialState } from '@wallet-reducers/SummaryReducer';

export type SummaryAction =
    | {
          type: typeof SUMMARY.INIT,
          payload: State,
      }
    | {
          type: typeof SUMMARY.DISPOSE,
      }
    | {
          type: typeof SUMMARY.DETAILS_TOGGLE,
      };

export const init = () => (dispatch: Dispatch): void => {
    const payload: State = {
        ...initialState,
    };

    dispatch({
        type: SUMMARY.INIT,
        payload,
    });
};

export const dispose = () => ({
    type: SUMMARY.DISPOSE,
});

export const onDetailsToggle = () => ({
    type: SUMMARY.DETAILS_TOGGLE,
});
