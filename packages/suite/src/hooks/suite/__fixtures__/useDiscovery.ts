import { SUITE } from 'src/actions/suite/constants';
import { DISCOVERY } from 'src/actions/wallet/constants';

const { getSuiteDevice } = global.JestMocks;
const DEV = getSuiteDevice();

export const actions = [
    {
        action: {
            type: SUITE.SELECT_DEVICE,
            payload: undefined,
        },
        renders: 1,
        result: {
            running: undefined,
            status: { type: 'waiting-for-device' },
        },
    },
    {
        action: {
            type: SUITE.SELECT_DEVICE,
            payload: DEV,
        },
        renders: 2,
        result: {
            running: undefined,
            status: { type: 'auth' },
        },
    },
    {
        action: {
            type: SUITE.UPDATE_SELECTED_DEVICE,
            payload: DEV,
        },
        renders: 2, // update of exact same device shouldn't cause render
        result: {
            running: undefined,
            status: { type: 'auth' },
        },
    },
    {
        action: {
            type: SUITE.UPDATE_SELECTED_DEVICE,
            payload: getSuiteDevice({ state: 'deviceState' }),
        },
        renders: 3,
        result: {
            running: undefined,
            status: undefined, // normally DISCOVERY.CREATE is called before SUITE.UPDATE_SELECTED_DEVICE, this is here only for coverage
        },
    },
    {
        action: {
            type: DISCOVERY.CREATE,
            payload: {
                deviceState: 'deviceState',
                authConfirm: true,
                status: DISCOVERY.STATUS.IDLE,
                total: 10,
                loaded: 0,
                networks: [],
                failed: [],
            },
        },
        renders: 4,
        result: {
            status: { type: 'auth-confirm' },
        },
    },
    {
        action: {
            type: DISCOVERY.UPDATE,
            payload: { deviceState: 'deviceState', status: DISCOVERY.STATUS.RUNNING, loaded: 2 },
        },
        renders: 5,
        result: {
            running: true,
            status: { type: 'auth-confirm' },
            progress: 20,
        },
    },
    {
        action: {
            type: DISCOVERY.UPDATE,
            payload: { deviceState: 'deviceState', authConfirm: false },
        },
        renders: 6,
        result: {
            running: true,
            status: { type: 'discovery' },
            progress: 20,
        },
    },
    {
        action: {
            type: DISCOVERY.UPDATE,
            payload: {
                deviceState: 'deviceState',
                status: DISCOVERY.STATUS.COMPLETED,
                authConfirm: true,
            },
        },
        renders: 7,
        result: {
            running: false,
            status: { type: 'auth-confirm' },
        },
    },
    {
        action: {
            type: SUITE.UPDATE_SELECTED_DEVICE,
            payload: getSuiteDevice({ authFailed: true }),
        },
        renders: 8,
        result: {
            running: undefined,
            status: { type: 'auth-failed' },
        },
    },
    {
        action: {
            type: SUITE.UPDATE_SELECTED_DEVICE,
            payload: getSuiteDevice({ authConfirm: true }),
        },
        renders: 9,
        result: {
            running: undefined,
            status: { type: 'auth-confirm-failed' },
        },
    },
    {
        action: {
            type: SUITE.UPDATE_SELECTED_DEVICE,
            payload: getSuiteDevice({ state: 'deviceState', available: false }), // available is used in one test case
        },
        renders: 10,
        result: {},
    },
    {
        action: {
            type: DISCOVERY.UPDATE,
            payload: { deviceState: 'deviceState', authConfirm: false },
        },
        renders: 11,
        result: {
            running: false,
            status: { type: 'discovery-empty' },
        },
    },
    {
        action: {
            type: DISCOVERY.UPDATE,
            payload: {
                deviceState: 'deviceState',
                networks: ['btc'],
                failed: ['btc'],
            },
        },
        renders: 12,
        result: {
            running: false,
            status: { type: 'discovery-failed' },
        },
    },
    {
        action: {
            type: DISCOVERY.UPDATE,
            payload: {
                deviceState: 'deviceState',
                failed: [],
                error: 'some error',
            },
        },
        renders: 13,
        result: {
            running: false,
            status: { type: 'discovery-failed' },
        },
    },
    {
        action: {
            type: DISCOVERY.UPDATE,
            payload: {
                deviceState: 'deviceState',
                networks: ['btc'],
                errorCode: 'Device_InvalidState',
            },
        },
        renders: 14,
        result: {
            running: false,
            status: { type: 'device-unavailable' },
        },
    },
    {
        action: {
            type: DISCOVERY.UPDATE,
            payload: {
                deviceState: 'deviceState',
                errorCode: undefined,
            },
        },
        renders: 15,
        result: {
            running: false,
            status: undefined, // this should never happen, only for coverage
        },
    },
];
