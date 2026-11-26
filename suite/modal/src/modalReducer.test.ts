import { deviceActions } from '@suite-common/device';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { UI_EVENTS, UI_REQUESTS } from '@trezor/connect';

import fixtures from './__fixtures__/modalReducer';
import { MODAL_CONTEXT_DEVICE_CONFIRMATION, MODAL_CONTEXT_NONE } from './constants';
import {
    beginStakingDeviceCheck,
    endStakingDeviceCheck,
    openModal,
    preserveModalOnTxTimeout,
} from './modalActions';
import { type State, modalReducer } from './modalReducer';

describe('modalReducer', () => {
    fixtures.forEach(f => {
        it(f.description, () => {
            let state: State = f.initialState as State;
            f.actions.forEach(a => {
                state = modalReducer(state, a);
            });
            expect(state).toEqual(f.result);
        });
    });
});

it.each([
    { type: UI_REQUESTS.REQUEST_CONFIRMATION, payload: { view: 'no-backup' } },
    { type: UI_REQUESTS.REQUEST_FEE, payload: { feeLevels: [], coinInfo: { shortcut: 'BTC' } } },
])('keeps $type visible on an unrelated disconnect until the staking check ends', action => {
    const form = modalReducer(undefined, openModal({ type: 'change-delegate' }));
    const begin = beginStakingDeviceCheck();
    const prompt = modalReducer(modalReducer(form, begin), action);
    expect(prompt.context).toBe(MODAL_CONTEXT_DEVICE_CONFIRMATION);
    expect(
        modalReducer(prompt, deviceActions.deviceDisconnect(mockSuiteDevice({ path: 'other' }))),
    ).toBe(prompt);
    expect(modalReducer(prompt, endStakingDeviceCheck({ id: begin.payload }))).toEqual(form);
});

it('consumes the timeout preserve flag when the previous staking signature closes', () => {
    const device = mockSuiteDevice();
    const prompt = modalReducer(undefined, { type: UI_REQUESTS.REQUEST_PIN, payload: { device } });
    const begin = beginStakingDeviceCheck();
    const retry = modalReducer(modalReducer(prompt, begin), preserveModalOnTxTimeout());
    const closed = modalReducer(retry, { type: UI_EVENTS.CLOSE_UI_WINDOW });

    expect(closed.stakingDeviceCheck?.id).toBe(begin.payload);
    expect(closed.preserveOnTxTimeout).toBe(false);
    expect(modalReducer(closed, endStakingDeviceCheck({ id: begin.payload }))).toEqual({
        ...prompt,
        preserveOnTxTimeout: false,
    });
});

it('does not restore the device signing modal when its device disconnects during a retry', () => {
    const device = mockSuiteDevice();
    const prompt = modalReducer(undefined, { type: UI_REQUESTS.REQUEST_PIN, payload: { device } });
    const begin = beginStakingDeviceCheck();
    const retry = modalReducer(prompt, begin);
    const disconnected = modalReducer(retry, deviceActions.deviceDisconnect(device));

    expect(modalReducer(disconnected, endStakingDeviceCheck({ id: begin.payload })).context).toBe(
        MODAL_CONTEXT_NONE,
    );
});
