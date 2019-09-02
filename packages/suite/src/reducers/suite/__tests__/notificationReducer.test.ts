import { DEVICE, Device } from 'trezor-connect';
import { NOTIFICATION } from '@suite-actions/constants';
import reducer from '@suite-reducers/notificationReducer';

const getPayload = (data?: any) => ({
    title: 'foo',
    variant: 'success',
    id: '1',
    devicePath: '1',
    ...data,
});

export const getInitialState = () => [];

describe('notification reducer', () => {
    it('test add', () => {
        expect(
            reducer(getInitialState(), {
                type: NOTIFICATION.ADD,
                payload: getPayload(),
            }),
        ).toMatchObject([
            {
                actions: undefined,
                cancelable: undefined,
                devicePath: '1',
                id: '1',
                message: undefined,
                title: 'foo',
                variant: 'success',
            },
        ]);
    });

    it('test close', () => {
        let state = reducer(getInitialState(), { type: NOTIFICATION.ADD, payload: getPayload() });
        state = reducer(state, { type: NOTIFICATION.ADD, payload: getPayload({ id: '2' }) });
        expect(state.length).toEqual(2);
        state = reducer(state, { type: NOTIFICATION.CLOSE, payload: { id: '2' } });
        expect(state.length).toEqual(1);
    });

    it('test what happens if device disconnects', () => {
        let state = reducer(getInitialState(), { type: NOTIFICATION.ADD, payload: getPayload() });
        state = reducer(state, {
            type: NOTIFICATION.ADD,
            payload: getPayload({ devicePath: '2' }),
        });
        expect(state.length).toEqual(2);
        // eslint-disable-next-line @typescript-eslint/no-object-literal-type-assertion
        const payload = { path: '2' } as Device;
        state = reducer(state, { type: DEVICE.DISCONNECT, payload });
        expect(state.length).toEqual(1);
    });
});
