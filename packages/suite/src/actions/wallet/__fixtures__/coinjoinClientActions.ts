import { testMocks } from '@suite-common/test-utils';
import * as COINJOIN from '@wallet-actions/constants/coinjoinConstants';

const DEVICE = testMocks.getSuiteDevice({ state: 'device-state', connected: true });

export const onCoinjoinRoundChanged = [
    {
        description: 'Phase 0. No associated coinjoin accounts',
        connect: undefined,
        state: {
            coinjoin: {
                accounts: [
                    { key: 'a', session: {} },
                    { key: 'b' }, // account b exists but without session
                ],
            },
        },
        params: {
            phase: 0,
            inputs: [{ accountKey: 'b' }, { accountKey: 'c' }],
            failed: [],
        },
        result: {
            actions: [],
        },
    },
    {
        description: 'Phase 1. (critical) TrezorConnect.setBusy not called. Device not found',
        connect: undefined,
        state: {
            accounts: [{ key: 'a', deviceState: 'device-state-2' }],
            coinjoin: {
                accounts: [{ key: 'a', session: {} }],
            },
        },
        params: {
            phase: 1,
            inputs: [{ accountKey: 'a' }],
            failed: [],
        },
        result: {
            actions: [COINJOIN.SESSION_ROUND_CHANGED],
            trezorConnectCalledTimes: 0,
        },
    },
    {
        description:
            'Phase 1. (critical) TrezorConnect.setBusy called once (2 passphrases on 1 device)',
        connect: undefined,
        state: {
            accounts: [
                { key: 'a', deviceState: 'device-state' },
                { key: 'b', deviceState: 'device-state-2' },
            ],
            coinjoin: {
                accounts: [
                    { key: 'a', session: {} },
                    { key: 'b', session: {} },
                ],
            },
        },
        params: [
            {
                phase: 1,
                inputs: [{ accountKey: 'a' }],
                failed: [],
                roundDeadline: Date.now() + 1000,
            },
            {
                phase: 1, // TrezorConnect called only once because second event has same phase
                inputs: [{ accountKey: 'a' }],
                failed: [],
                roundDeadline: Date.now() + 1000,
            },
        ],
        result: {
            actions: [COINJOIN.SESSION_ROUND_CHANGED, COINJOIN.SESSION_ROUND_CHANGED],
            trezorConnectCalledTimes: 1,
            trezorConnectCallsWith: { expiry_ms: expect.any(Number) }, // ~1000
        },
    },
    {
        description: 'Phase 1. (critical) TrezorConnect.setBusy called on two physical devices',
        connect: undefined,
        state: {
            devices: [DEVICE, { ...DEVICE, state: 'device-state-2', id: '2' }],
            accounts: [
                { key: 'a', deviceState: 'device-state' },
                { key: 'b', deviceState: 'device-state-2' },
            ],
            coinjoin: {
                accounts: [
                    { key: 'a', session: {} },
                    { key: 'b', session: {} },
                ],
            },
        },
        params: [
            {
                phase: 1,
                inputs: [{ accountKey: 'a' }, { accountKey: 'b' }],
                failed: [],
                roundDeadline: Date.now() + 1000,
            },
        ],
        result: {
            actions: [COINJOIN.SESSION_ROUND_CHANGED, COINJOIN.SESSION_ROUND_CHANGED],
            trezorConnectCalledTimes: 2,
            trezorConnectCallsWith: { expiry_ms: expect.any(Number) }, // ~1000
        },
    },
    {
        description: 'Phase 4. (end) TrezorConnect.setBusy called',
        connect: undefined,
        state: {
            accounts: [{ key: 'a', deviceState: 'device-state' }],
            coinjoin: {
                accounts: [{ key: 'a', session: {} }],
            },
        },
        params: {
            phase: 4,
            inputs: [{ accountKey: 'a' }],
            failed: [],
            roundDeadline: Date.now() + 1000,
        },
        result: {
            actions: [COINJOIN.SESSION_ROUND_CHANGED],
            trezorConnectCalledTimes: 1,
            trezorConnectCallsWith: { expiry_ms: undefined },
        },
    },
    {
        description: 'Multiple events',
        connect: undefined,
        state: {
            accounts: [{ key: 'a', deviceState: 'device-state' }],
            coinjoin: {
                accounts: [{ key: 'a', session: {} }],
            },
        },
        params: [
            {
                phase: 0,
                inputs: [{ accountKey: 'a' }],
                failed: [],
                roundDeadline: Date.now() + 1000,
            },
            {
                phase: 1,
                inputs: [{ accountKey: 'a' }],
                failed: [],
                roundDeadline: Date.now() + 1000,
            },
            {
                phase: 2,
                inputs: [{ accountKey: 'a' }],
                failed: [],
                roundDeadline: Date.now() + 1000,
            },
            {
                phase: 3,
                inputs: [{ accountKey: 'a' }],
                failed: [],
                roundDeadline: Date.now() + 1000,
            },
            {
                phase: 4,
                inputs: [{ accountKey: 'a' }],
                failed: [],
                roundDeadline: Date.now() + 1000,
            },
        ],
        result: {
            actions: [
                COINJOIN.SESSION_ROUND_CHANGED,
                COINJOIN.SESSION_ROUND_CHANGED,
                COINJOIN.SESSION_ROUND_CHANGED,
                COINJOIN.SESSION_ROUND_CHANGED,
                COINJOIN.SESSION_ROUND_CHANGED,
            ],
            trezorConnectCalledTimes: 2,
            trezorConnectCallsWith: { expiry_ms: undefined },
        },
    },
];
