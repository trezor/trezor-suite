import * as receiveActions from '@wallet-actions/receiveActions';
import { RECEIVE } from '../constants';
import { NOTIFICATION } from '@suite-actions/constants';

const { getSuiteDevice } = global.JestMocks;

const PATH = "m/49'/0'/0'/0/0";

const UNAVAILABLE_DEVICE = getSuiteDevice({ available: false });

export default [
    {
        description: 'Show unverified address',
        initialState: undefined,
        mocks: {},
        action: () => receiveActions.showUnverifiedAddress(PATH),
        result: {
            actions: [
                {
                    type: RECEIVE.SHOW_UNVERIFIED_ADDRESS,
                    descriptor: PATH,
                },
            ],
        },
    },
    {
        description: 'Show address',
        initialState: undefined,
        mocks: {},
        action: () => receiveActions.showAddress(PATH),
        result: {
            actions: [
                { type: RECEIVE.INIT, descriptor: PATH },
                { type: RECEIVE.SHOW_ADDRESS, descriptor: PATH },
            ],
        },
    },
    {
        description: 'Show address, no device',
        initialState: {
            suite: {
                device: getSuiteDevice({ available: false }),
            },
        },
        mocks: {},
        action: () => receiveActions.showAddress(PATH),
        result: {
            actions: [
                { type: RECEIVE.REQUEST_UNVERIFIED, device: UNAVAILABLE_DEVICE, addressPath: PATH },
            ],
        },
    },
    {
        description: 'Show address, connect error',
        initialState: undefined,
        mocks: {
            getAddress: { success: false, payload: {} },
        },
        action: () => receiveActions.showAddress(PATH),
        result: {
            actions: [
                { type: RECEIVE.INIT, descriptor: PATH },
                { type: RECEIVE.HIDE_ADDRESS, descriptor: PATH },
                { type: NOTIFICATION.ADD },
            ],
        },
    },
] as const;
