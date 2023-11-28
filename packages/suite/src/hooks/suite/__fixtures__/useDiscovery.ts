import { testMocks } from '@suite-common/test-utils';
import { deviceActions, discoveryActions } from '@suite-common/wallet-core';
import { DiscoveryStatus } from '@suite-common/wallet-constants';

const { getSuiteDevice } = testMocks;
const DEV = getSuiteDevice();

export const actions = [
    {
        action: {
            type: deviceActions.selectDevice.type,
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
            type: deviceActions.selectDevice.type,
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
            type: deviceActions.updateSelectedDevice.type,
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
            type: deviceActions.updateSelectedDevice.type,
            payload: getSuiteDevice({ state: 'deviceState' }),
        },
        renders: 3,
        result: {
            running: undefined,
            status: undefined, // normally discoveryActions.createDiscovery is called before deviceActions.updateSelectedDevice.type, this is here only for coverage
        },
    },
    {
        action: {
            type: discoveryActions.createDiscovery.type,
            payload: {
                deviceState: 'deviceState',
                authConfirm: true,
                status: DiscoveryStatus.IDLE,
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
            type: discoveryActions.updateDiscovery.type,
            payload: { deviceState: 'deviceState', status: DiscoveryStatus.RUNNING, loaded: 2 },
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
            type: discoveryActions.updateDiscovery.type,
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
            type: discoveryActions.updateDiscovery.type,
            payload: {
                deviceState: 'deviceState',
                status: DiscoveryStatus.COMPLETED,
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
            type: deviceActions.updateSelectedDevice.type,
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
            type: deviceActions.updateSelectedDevice.type,
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
            type: deviceActions.updateSelectedDevice.type,
            payload: getSuiteDevice({ state: 'deviceState', available: false }), // available is used in one test case
        },
        renders: 10,
        result: {},
    },
    {
        action: {
            type: discoveryActions.updateDiscovery.type,
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
            type: discoveryActions.updateDiscovery.type,
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
            type: discoveryActions.updateDiscovery.type,
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
            type: discoveryActions.updateDiscovery.type,
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
            type: discoveryActions.updateDiscovery.type,
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
