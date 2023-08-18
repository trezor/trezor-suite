import { testMocks } from '@suite-common/test-utils';

import * as MODAL from 'src/actions/suite/constants/modalConstants';
import * as COINJOIN from 'src/actions/wallet/constants/coinjoinConstants';

export const DEVICE = testMocks.getSuiteDevice({
    state: 'device-state',
    connected: true,
    available: true,
    remember: true,
});

const SESSION = { signedRounds: [] as string[], sessionPhaseQueue: [], maxRounds: 10 };

export const onCoinjoinRoundChanged = [
    {
        description: 'Phase 0. No associated coinjoin accounts',
        connect: undefined,
        state: {
            coinjoin: {
                accounts: [
                    { key: 'a', session: SESSION },
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
            trezorConnectCalledTimes: 0,
        },
    },
    {
        description: 'Phase 1. (critical) TrezorConnect.setBusy not called. Device not found',
        connect: undefined,
        state: {
            accounts: [{ key: 'a', deviceState: 'device-state-2' }],
            selectedAccount: { key: 'a' },
            coinjoin: {
                accounts: [{ key: 'a', session: SESSION }],
            },
        },
        params: {
            phase: 1,
            inputs: [{ accountKey: 'a' }],
            failed: [],
        },
        result: {
            actions: [COINJOIN.SESSION_ROUND_CHANGED, MODAL.OPEN_USER_CONTEXT],
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
            selectedAccount: { key: 'a' },
            coinjoin: {
                accounts: [
                    { key: 'a', session: SESSION },
                    { key: 'b', session: SESSION },
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
            actions: [
                COINJOIN.SESSION_ROUND_CHANGED,
                MODAL.OPEN_USER_CONTEXT,
                COINJOIN.SESSION_ROUND_CHANGED,
            ],
            trezorConnectCalledTimes: 1,
            trezorConnectCallsWith: { expiry_ms: expect.any(Number) }, // ~1000
        },
    },
    {
        description: 'Phase 1. (critical) TrezorConnect.setBusy called on two physical devices',
        connect: undefined,
        state: {
            device: {
                devices: [DEVICE, { ...DEVICE, state: 'device-state-2', id: '2' }],
            },
            accounts: [
                { key: 'a', deviceState: 'device-state' },
                { key: 'b', deviceState: 'device-state-2' },
            ],
            selectedAccount: { key: 'a' },
            coinjoin: {
                accounts: [
                    { key: 'a', session: SESSION },
                    { key: 'b', session: SESSION },
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
            actions: [
                COINJOIN.SESSION_ROUND_CHANGED,
                COINJOIN.SESSION_ROUND_CHANGED,
                MODAL.OPEN_USER_CONTEXT,
            ],
            trezorConnectCalledTimes: 2,
            trezorConnectCallsWith: { expiry_ms: expect.any(Number) }, // ~1000
        },
    },
    {
        description: 'Phase 4. (end) TrezorConnect.setBusy called',
        connect: undefined,
        state: {
            device: {
                devices: [{ ...DEVICE, features: { busy: true } }],
            },
            accounts: [{ key: 'a', deviceState: 'device-state' }],
            selectedAccount: { key: 'a' },
            coinjoin: {
                accounts: [
                    {
                        key: 'a',
                        session: { signedRounds: ['1', '2'], maxRounds: 2 },
                    },
                ],
            },
        },
        params: {
            phase: 4,
            endRoundState: 4,
            broadcastedTxDetails: { txid: 'abcd' },
            inputs: [{ accountKey: 'a' }],
            failed: [],
            roundDeadline: Date.now() + 1000,
        },
        result: {
            actions: [
                COINJOIN.SESSION_ROUND_CHANGED,
                COINJOIN.SESSION_TX_BROADCASTED,
                MODAL.OPEN_USER_CONTEXT,
                COINJOIN.SESSION_COMPLETED,
            ],
            trezorConnectCalledTimes: 1,
            trezorConnectCallsWith: { expiry_ms: undefined },
        },
    },
    {
        description: 'Phase 4. (end) TrezorConnect.setBusy not called (device is not busy)',
        connect: undefined,
        state: {
            device: {
                devices: [{ ...DEVICE, features: { busy: false } }],
            },
            accounts: [{ key: 'a', deviceState: 'device-state' }],
            selectedAccount: { key: 'a' },
            coinjoin: {
                accounts: [
                    {
                        key: 'a',
                        session: { signedRounds: ['1', '2'], maxRounds: 2 },
                    },
                ],
            },
        },
        params: {
            phase: 4,
            endRoundState: 2,
            inputs: [{ accountKey: 'a' }],
            failed: [],
            roundDeadline: Date.now() + 1000,
        },
        result: {
            actions: [
                COINJOIN.SESSION_ROUND_CHANGED,
                COINJOIN.SESSION_TX_FAILED,
                MODAL.OPEN_USER_CONTEXT,
                COINJOIN.SESSION_COMPLETED,
            ],
            trezorConnectCalledTimes: 0,
        },
    },
    {
        description: 'Phase 4. (end) with autostop enabled',
        connect: undefined,
        state: {
            devices: [{ ...DEVICE, features: { busy: false } }],
            accounts: [{ key: 'account-A', deviceState: 'device-state' }],
            selectedAccount: { key: 'account-A' },
            coinjoin: {
                accounts: [
                    {
                        key: 'account-A',
                        session: {
                            signedRounds: ['1', '2'],
                            maxRounds: 10,
                            isAutoStopEnabled: true,
                        },
                    },
                ],
            },
        },
        params: {
            phase: 4,
            endRoundState: 4,
            inputs: [{ accountKey: 'account-A' }],
            failed: [],
            roundDeadline: Date.now() + 1000,
        },
        result: {
            actions: [
                COINJOIN.SESSION_ROUND_CHANGED,
                COINJOIN.SESSION_TX_BROADCASTED,
                COINJOIN.ACCOUNT_UNREGISTER,
            ],
            trezorConnectCalledTimes: 0,
        },
    },
    {
        description: 'Multiple events - coinjoin ends at max rounds',
        connect: undefined,
        state: {
            device: {
                devices: [{ ...DEVICE, features: { busy: true } }],
            },
            accounts: [
                {
                    key: 'a',
                    deviceState: 'device-state',
                    addresses: { anonymitySet: { address: 1 } },
                    utxo: [{ address: 'address' }],
                },
            ],
            selectedAccount: { key: 'a' },
            coinjoin: {
                accounts: [
                    {
                        key: 'a',
                        session: { signedRounds: ['1', '2'], maxRounds: 2 },
                    },
                ],
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
                endRoundState: 4,
                broadcastedTxDetails: { txid: 'abcd' },
                inputs: [{ accountKey: 'a' }],
                failed: [],
                roundDeadline: Date.now() + 1000,
            },
        ],
        result: {
            actions: [
                COINJOIN.SESSION_ROUND_CHANGED,
                COINJOIN.SESSION_ROUND_CHANGED,
                MODAL.OPEN_USER_CONTEXT,
                COINJOIN.SESSION_ROUND_CHANGED,
                COINJOIN.SESSION_ROUND_CHANGED,
                COINJOIN.SESSION_ROUND_CHANGED,
                MODAL.CLOSE,
                COINJOIN.SESSION_TX_BROADCASTED,
                MODAL.OPEN_USER_CONTEXT,
                COINJOIN.SESSION_COMPLETED,
            ],
            trezorConnectCalledTimes: 2,
            trezorConnectCallsWith: { expiry_ms: undefined },
        },
    },
];

export const getOwnershipProof = [
    {
        description: 'getOwnershipProof success with 3 accounts, 2 passphrases, 2 physical devices',
        connect: [
            {
                success: true,
                payload: [
                    { ownership_proof: 'AA0011' },
                    { ownership_proof: 'AB0011' },
                    { ownership_proof: 'AC0011' }, // this was not requested, will be ignored
                ],
            },
            {
                success: true,
                payload: [{ ownership_proof: 'BA0011' }, { ownership_proof: 'BB0011' }],
            },
            {
                success: true,
                payload: [{ ownership_proof: 'CA0011' }, { ownership_proof: 'CB0011' }],
            },
        ],
        state: {
            device: {
                devices: [
                    DEVICE,
                    { ...DEVICE, state: 'device-state-2' },
                    { ...DEVICE, state: 'device-2-state', id: '2' },
                ],
            },
            accounts: [
                { key: 'account-A', deviceState: 'device-state', utxo: [] },
                { key: 'account-B', deviceState: 'device-state-2', utxo: [] },
                { key: 'account-C', deviceState: 'device-2-state', utxo: [] },
            ],
            coinjoin: {
                clients: {},
                accounts: [
                    { key: 'account-A', session: SESSION },
                    { key: 'account-B', session: SESSION },
                    { key: 'account-C', session: SESSION },
                ],
            },
        },
        params: [
            {
                type: 'ownership',
                roundId: '11',
                inputs: [
                    { accountKey: 'account-A', path: 'm/10025', outpoint: 'AA' },
                    { accountKey: 'account-A', path: 'm/10025', outpoint: 'AB' },
                    { accountKey: 'account-B', path: 'm/10025', outpoint: 'BA' },
                    { accountKey: 'account-B', path: 'm/10025', outpoint: 'BB' },
                    { accountKey: 'account-C', path: 'm/10025', outpoint: 'CA' },
                    { accountKey: 'account-C', path: 'm/10025', outpoint: 'CB' },
                ],
                commitmentData: '0011',
            },
        ],
        result: {
            trezorConnectCalledTimes: 3,
            response: [
                {
                    type: 'ownership',
                    inputs: [
                        { outpoint: 'AA', ownershipProof: 'AA0011' },
                        { outpoint: 'AB', ownershipProof: 'AB0011' },
                        { outpoint: 'BA', ownershipProof: 'BA0011' },
                        { outpoint: 'BB', ownershipProof: 'BB0011' },
                        { outpoint: 'CA', ownershipProof: 'CA0011' },
                        { outpoint: 'CB', ownershipProof: 'CB0011' },
                    ],
                },
            ],
        },
    },
    {
        description:
            'getOwnershipProof unsuccessful with error from Trezor and one unresolved request',
        connect: [
            {
                success: false,
                payload: {
                    error: 'Firmware error',
                },
            },
            {
                success: true,
                payload: [],
            },
        ],
        state: {
            devices: [DEVICE, { ...DEVICE, state: 'device-state-2' }],
            accounts: [
                { key: 'account-A', deviceState: 'device-state', utxo: [] },
                { key: 'account-B', deviceState: 'device-state-2', utxo: [] },
            ],
            coinjoin: {
                clients: {},
                accounts: [
                    { key: 'account-A', session: SESSION },
                    { key: 'account-B', session: SESSION },
                ],
            },
        },
        params: [
            {
                type: 'ownership',
                roundId: '11',
                inputs: [
                    { accountKey: 'account-A', path: 'm/10025', outpoint: 'AA' },
                    { accountKey: 'account-B', path: 'm/10025', outpoint: 'BA' },
                ],
                commitmentData: '0011',
            },
        ],
        result: {
            trezorConnectCalledTimes: 2,
            response: [
                {
                    type: 'ownership',
                    inputs: [
                        { outpoint: 'AA', error: 'Firmware error' },
                        { outpoint: 'BA', error: 'Request unresolved' },
                    ],
                },
            ],
        },
    },
    {
        description: 'getOwnershipProof unsuccessful with multiple unresolved inputs',
        connect: [],
        state: {
            suite: {
                locks: [2],
            },
            devices: [
                DEVICE,
                { ...DEVICE, state: 'device-state-2' },
                { ...DEVICE, state: 'device-2-state', id: '2', connected: false },
                { ...DEVICE, state: 'device-3-state', id: '3' },
            ],
            accounts: [
                { key: 'account-A', deviceState: 'device-state', utxo: [] },
                { key: 'account-B', deviceState: 'device-state-2', utxo: [] },
                { key: 'account-C', deviceState: 'device-2-state', utxo: [] },
            ],
            coinjoin: {
                clients: {},
                accounts: [
                    { key: 'account-A', session: SESSION },
                    { key: 'account-B' },
                    { key: 'account-C', session: SESSION },
                ],
            },
        },
        params: [
            {
                type: 'ownership',
                roundId: '11',
                inputs: [
                    { accountKey: 'account-A', path: 'm/10025', outpoint: 'AA' },
                    { accountKey: 'account-B', path: 'm/10025', outpoint: 'BA' },
                    { accountKey: 'account-B2', path: 'm/10025', outpoint: 'B2AA' },
                    { accountKey: 'account-C', path: 'm/10025', outpoint: 'CA' },
                ],
                commitmentData: '0011',
            },
        ],
        result: {
            trezorConnectCalledTimes: 0,
            response: [
                {
                    type: 'ownership',
                    inputs: [
                        { outpoint: 'AA', error: 'Device locked' },
                        { outpoint: 'BA', error: 'Account without session' },
                        { outpoint: 'B2AA', error: 'Account not found' },
                        { outpoint: 'CA', error: 'Device disconnected' },
                    ],
                },
            ],
        },
    },
];

export const signCoinjoinTx = [
    {
        description: 'signCoinjoinTx success with 3 accounts, 2 passphrases, 2 physical devices',
        connect: [
            // connect responses order, first physical device id: 2, device-2-state
            {
                success: true,
                payload: {
                    signatures: ['', '', '05'], // account-A
                },
            },
            // then physical device id: 1, device-state
            {
                success: true,
                payload: {
                    signatures: ['01', '', ''], // account-B
                },
            },
            // then physical device id: 1, device-state-2
            {
                success: true,
                payload: {
                    signatures: ['', '02', ''], // account-C
                },
            },
        ],
        state: {
            device: {
                devices: [
                    DEVICE,
                    { ...DEVICE, state: 'device-state-2' },
                    { ...DEVICE, state: 'device-2-state', id: '2' },
                ],
            },
            accounts: [
                {
                    key: 'account-A',
                    deviceState: 'device-state',
                    utxo: [
                        {
                            txid: '123400000000000000000000000000000000000000000000000000000000dbca',
                            vout: 5,
                        },
                    ],
                    addresses: {
                        change: [{ address: 'A1' }, { address: 'A2' }],
                    },
                },
                {
                    key: 'account-B',
                    deviceState: 'device-state-2',
                    utxo: [
                        {
                            txid: '123400000000000000000000000000000000000000000000000000000000dbca',
                            vout: 1,
                        },
                    ],
                    addresses: {
                        change: [{ address: 'B1' }, { address: 'B2' }],
                    },
                },
                {
                    key: 'account-C',
                    deviceState: 'device-2-state',
                    utxo: [
                        {
                            txid: '123400000000000000000000000000000000000000000000000000000000dbca',
                            vout: 2,
                        },
                    ],
                    addresses: {
                        change: [{ address: 'C1' }, { address: 'C2' }],
                    },
                },
            ],
            coinjoin: {
                clients: {},
                accounts: [
                    { key: 'account-A', session: SESSION, unlockPath: {} },
                    { key: 'account-B', session: SESSION, unlockPath: {} },
                    { key: 'account-C', session: SESSION, unlockPath: {} },
                ],
            },
        },
        params: {
            type: 'signature',
            roundId: '1',
            inputs: [
                {
                    accountKey: 'account-A',
                    outpoint:
                        'cadb00000000000000000000000000000000000000000000000000000000341205000000',
                    path: 'm/10025',
                },
                {
                    accountKey: 'account-B',
                    outpoint:
                        'cadb00000000000000000000000000000000000000000000000000000000341201000000',
                    path: 'm/10025',
                },
                {
                    accountKey: 'account-C',
                    outpoint:
                        'cadb00000000000000000000000000000000000000000000000000000000341202000000',
                    path: 'm/10025',
                },
            ],
            transaction: {
                inputs: [
                    // NOTE: inputs/outputs order may be sorted differently than signing order, they are sorted by coordinator rules
                    // while signing be done by param.inputs order
                    {
                        outpoint:
                            'cadb00000000000000000000000000000000000000000000000000000000341201000000', // account-C
                        path: 'm/10025',
                        amount: 1000000,
                        commitmentData: '',
                        scriptPubKey: '',
                    },
                    {
                        outpoint:
                            'cadb00000000000000000000000000000000000000000000000000000000341202000000', // account-A
                        path: 'm/10025',
                        amount: 1000000,
                        commitmentData: '',
                        scriptPubKey: '',
                    },
                    {
                        outpoint:
                            'cadb00000000000000000000000000000000000000000000000000000000341205000000', // account-B
                        path: 'm/10025',
                        amount: 1000000,
                        commitmentData: '',
                        scriptPubKey: '',
                    },
                ],
                outputs: [
                    { address: 'A1', path: 'm/10025', amount: 500000 }, // account-A
                    { address: 'B2', path: 'm/10025', amount: 499500 }, // account-B
                    { address: 'A2', path: 'm/10025', amount: 499500 }, // account-A
                    { address: 'C1', path: 'm/10025', amount: 500000 }, // accounCt-C
                    { address: 'B1', path: 'm/10025', amount: 500000 }, // account-B
                    { address: 'C2', path: 'm/10025', amount: 499500 }, // account-C
                ],
                affiliateRequest: {
                    coinjoin_flags_array: [],
                },
            },
            liquidityClues: [{ accountKey: 'account-A', rawLiquidityClue: 1 }],
        },
        result: {
            actions: [],
            trezorConnectCalledTimes: 3,
            trezorConnectCalledWith: [
                {
                    inputs: [
                        { script_type: 'EXTERNAL' },
                        { script_type: 'EXTERNAL' },
                        { script_type: 'SPENDTAPROOT' }, // account-A
                    ],
                    outputs: [
                        { script_type: 'PAYTOTAPROOT' }, // account-A
                        { script_type: 'PAYTOADDRESS' },
                        { script_type: 'PAYTOTAPROOT' }, // account-A
                        { script_type: 'PAYTOADDRESS' },
                        { script_type: 'PAYTOADDRESS' },
                        { script_type: 'PAYTOADDRESS' },
                    ],
                },
                // account-B
                {
                    inputs: [
                        { script_type: 'SPENDTAPROOT' }, // account-B
                        { script_type: 'EXTERNAL' },
                        { script_type: 'EXTERNAL' },
                    ],
                    outputs: [
                        { script_type: 'PAYTOADDRESS' },
                        { script_type: 'PAYTOTAPROOT' }, // account-B
                        { script_type: 'PAYTOADDRESS' },
                        { script_type: 'PAYTOADDRESS' },
                        { script_type: 'PAYTOTAPROOT' }, // account-B
                        { script_type: 'PAYTOADDRESS' },
                    ],
                },
                // account-C
                {
                    inputs: [
                        { script_type: 'EXTERNAL' },
                        { script_type: 'SPENDTAPROOT' }, // account-C
                        { script_type: 'EXTERNAL' },
                    ],
                    outputs: [
                        { script_type: 'PAYTOADDRESS' },
                        { script_type: 'PAYTOADDRESS' },
                        { script_type: 'PAYTOADDRESS' },
                        { script_type: 'PAYTOTAPROOT' }, // account-C
                        { script_type: 'PAYTOADDRESS' },
                        { script_type: 'PAYTOTAPROOT' }, // account-C
                    ],
                },
            ],
            // this will be sent back to @trezor/coinjoin
            response: {
                type: 'signature',
                roundId: '1',
                inputs: [
                    {
                        outpoint:
                            'cadb00000000000000000000000000000000000000000000000000000000341205000000',
                        signature: '05',
                        index: 2,
                    },
                    {
                        outpoint:
                            'cadb00000000000000000000000000000000000000000000000000000000341201000000',
                        signature: '01',
                        index: 0,
                    },
                    {
                        outpoint:
                            'cadb00000000000000000000000000000000000000000000000000000000341202000000',
                        signature: '02',
                        index: 1,
                    },
                ],
            },
        },
    },
    {
        description: 'signCoinjoinTx unsuccessful with error from Trezor',
        connect: [
            {
                success: false,
                payload: {
                    error: 'Firmware error',
                },
            },
        ],
        state: {
            devices: [DEVICE],
            accounts: [
                {
                    key: 'account-A',
                    deviceState: 'device-state',
                    utxo: [
                        {
                            txid: '123400000000000000000000000000000000000000000000000000000000dbca',
                            vout: 5,
                        },
                    ],
                    addresses: {
                        change: [{ address: 'A1' }, { address: 'A2' }],
                    },
                },
            ],
            coinjoin: {
                clients: {},
                accounts: [{ key: 'account-A', session: SESSION, unlockPath: {} }],
            },
        },
        params: {
            type: 'signature',
            roundId: '1',
            inputs: [
                {
                    accountKey: 'account-A',
                    outpoint:
                        'cadb00000000000000000000000000000000000000000000000000000000341205000000',
                    path: 'm/10025',
                },
            ],
            transaction: {
                inputs: [
                    {
                        outpoint:
                            'cadb00000000000000000000000000000000000000000000000000000000341205000000', // account-A
                        path: 'm/10025',
                        amount: 1000000,
                        commitmentData: '',
                        scriptPubKey: '',
                    },
                ],
                outputs: [
                    { address: 'A1', path: 'm/10025', amount: 500000 }, // account-A
                    { address: 'A2', path: 'm/10025', amount: 499500 }, // account-A
                ],
                affiliateRequest: {
                    coinjoin_flags_array: [],
                },
            },
            liquidityClues: [],
        },
        result: {
            actions: [],
            trezorConnectCalledTimes: 1,
            trezorConnectCalledWith: [
                {
                    inputs: [
                        { script_type: 'SPENDTAPROOT' }, // account-A
                    ],
                    outputs: [
                        { script_type: 'PAYTOTAPROOT' }, // account-A
                        { script_type: 'PAYTOTAPROOT' }, // account-A
                    ],
                },
            ],
            // this will be sent back to @trezor/coinjoin
            response: {
                type: 'signature',
                roundId: '1',
                inputs: [
                    {
                        outpoint:
                            'cadb00000000000000000000000000000000000000000000000000000000341205000000',
                        error: expect.any(String), // depends on OS "2.1.1-df0963ec (linux) Firmware error"
                    },
                ],
            },
        },
    },
    {
        description:
            'signCoinjoinTx unsuccessful with unresolved inputs (missing session, missing account, disconnected device)',
        connect: [
            {
                success: true,
                payload: {
                    signatures: ['', '', ''],
                },
            },
        ],
        state: {
            devices: [
                DEVICE,
                { ...DEVICE, state: 'device-state-2' },
                { ...DEVICE, state: 'device-2-state', id: '2', connected: false },
            ],
            accounts: [
                {
                    key: 'account-A',
                    deviceState: 'device-state',
                    utxo: [
                        {
                            txid: '123400000000000000000000000000000000000000000000000000000000dbca',
                            vout: 5,
                        },
                    ],
                    addresses: {
                        change: [{ address: 'A1' }, { address: 'A2' }],
                    },
                },
                {
                    key: 'account-B',
                    deviceState: 'device-state-2',
                    utxo: [
                        {
                            txid: '123400000000000000000000000000000000000000000000000000000000dbca',
                            vout: 1,
                        },
                    ],
                    addresses: {
                        change: [{ address: 'B1' }, { address: 'B2' }],
                    },
                },
                {
                    key: 'account-C',
                    deviceState: 'device-2-state',
                    utxo: [
                        {
                            txid: '123400000000000000000000000000000000000000000000000000000000dbca',
                            vout: 2,
                        },
                    ],
                    addresses: {
                        change: [{ address: 'C1' }, { address: 'C2' }],
                    },
                },
            ],
            coinjoin: {
                clients: {},
                accounts: [
                    { key: 'account-A', unlockPath: {} },
                    { key: 'account-B', session: SESSION, unlockPath: {} },
                    { key: 'account-C', session: SESSION, unlockPath: {} },
                ],
            },
        },
        params: {
            type: 'signature',
            roundId: '1',
            inputs: [
                {
                    accountKey: 'account-A',
                    outpoint:
                        'cadb00000000000000000000000000000000000000000000000000000000341205000000',
                    path: 'm/10025',
                },
                {
                    accountKey: 'account-B',
                    outpoint:
                        'cadb00000000000000000000000000000000000000000000000000000000341201000000',
                    path: 'm/10025',
                },
                {
                    accountKey: 'account-B2',
                    outpoint:
                        'cadb00000000000000000000000000000000000000000000000000000000341201100000',
                    path: 'm/10025',
                },
                {
                    accountKey: 'account-C',
                    outpoint:
                        'cadb00000000000000000000000000000000000000000000000000000000341202000000',
                    path: 'm/10025',
                },
            ],
            transaction: {
                inputs: [
                    {
                        outpoint:
                            'cadb00000000000000000000000000000000000000000000000000000000341205000000', // account-A
                        path: 'm/10025',
                        amount: 1000000,
                        commitmentData: '',
                        scriptPubKey: '',
                    },
                ],
                outputs: [
                    { address: 'A1', path: 'm/10025', amount: 500000 }, // account-A
                ],
                affiliateRequest: {
                    coinjoin_flags_array: [],
                },
            },
            liquidityClues: [],
        },
        result: {
            actions: [],
            trezorConnectCalledTimes: 1,
            trezorConnectCalledWith: [
                {
                    device: {
                        state: 'device-state-2',
                    },
                    inputs: [
                        { script_type: 'EXTERNAL' }, // account-A
                    ],
                    outputs: [
                        { script_type: 'PAYTOADDRESS' }, // account-A
                    ],
                },
            ],
            // this will be sent back to @trezor/coinjoin
            response: {
                type: 'signature',
                roundId: '1',
                inputs: [
                    {
                        outpoint:
                            'cadb00000000000000000000000000000000000000000000000000000000341205000000',
                        error: 'Account without session',
                    },
                    {
                        outpoint:
                            'cadb00000000000000000000000000000000000000000000000000000000341201100000',
                        error: 'Account not found',
                    },
                    {
                        outpoint:
                            'cadb00000000000000000000000000000000000000000000000000000000341202000000',
                        error: 'Device disconnected',
                    },
                    {
                        outpoint:
                            'cadb00000000000000000000000000000000000000000000000000000000341201000000',
                        error: 'Request unresolved',
                        // unresolved request because transaction data contains only input from account-A
                        // obviously in that case tx should be rejected by the device...
                    },
                ],
            },
        },
    },
];

export const clientEvents = [
    {
        description: 'StatusEvent updates client values',
        event: 'status',
        state: {},
        params: {
            rounds: [
                { Id: '00', Phase: 0 },
                { Id: '01', Phase: 3 },
            ],
            changed: [],
            feeRateMedian: 129,
            coordinationFeeRate: {
                rate: 0.003,
                plebsDontPayThreshold: 1000000,
            },
            allowedInputAmounts: { min: 5000, max: 134375000000 },
        },
        result: {
            clients: {
                btc: {
                    status: 'loaded',
                    coordinationFeeRate: {
                        rate: 0.003,
                        plebsDontPayThreshold: 1000000,
                    },
                    allowedInputAmounts: { min: 5000, max: 134375000000 },
                    rounds: [
                        { id: '00', phase: 0 },
                        { id: '01', phase: 3 },
                    ],
                },
            },
        },
    },
    {
        description: 'PrisonEvent adds input to prison',
        event: 'prison',
        state: {
            coinjoin: {
                accounts: [{ key: 'account-A' }],
            },
        },
        params: {
            prison: [
                {
                    type: 'input',
                    accountKey: 'account-A',
                    id: 'cadb00000000000000000000000000000000000000000000000000000000341205000000',
                    sentenceStart: Date.now(),
                    sentenceEnd: Date.now() + 100,
                    errorCode: 'blameOf',
                },
                {
                    type: 'account',
                    accountKey: 'account-A',
                    id: 'account-A',
                    sentenceStart: Date.now(),
                    sentenceEnd: Date.now() + 100,
                    errorCode: 'blameOf',
                },
            ],
        },
        result: {
            accounts: [
                {
                    key: 'account-A',
                    prison: {
                        cadb00000000000000000000000000000000000000000000000000000000341205000000: {
                            type: 'input',
                            errorCode: 'blameOf',
                        },
                    },
                },
            ],
        },
    },
    {
        description: 'RoundChanged sessionDeadline updated',
        event: 'round',
        state: {
            accounts: [{ key: 'account-A', deviceState: 'device-state' }],
            coinjoin: {
                config: {
                    averageAnonymityGainPerRound: 1,
                },
                accounts: [{ key: 'account-A', session: SESSION }],
            },
        },
        params: {
            round: {
                id: '00',
                phase: 0,
                endRoundState: 0,
                inputs: [{ accountKey: 'account-A' }],
                failed: [],
                addresses: [],
                phaseDeadline: Date.now() + 1000,
                roundDeadline: Date.now() + 10000,
            },
        },
        result: {
            accounts: [
                {
                    key: 'account-A',
                    session: {
                        sessionDeadline: expect.any(Number),
                    },
                },
            ],
        },
    },
    {
        description: 'SessionPhase sessionPhaseQueue updated',
        event: 'session-phase',
        state: {
            accounts: [{ key: 'account-A', deviceState: 'device-state' }],
            coinjoin: {
                accounts: [{ key: 'account-A', session: SESSION }],
            },
        },
        params: {
            phase: 101,
            accountKeys: ['account-A'],
        },
        result: {
            accounts: [
                {
                    key: 'account-A',
                    session: {
                        sessionPhaseQueue: [101],
                    },
                },
            ],
        },
    },
];
