import { CORE_CALL, asDeviceUniquePath, createResponseMessage } from '@trezor/connect-common';
import type {
    AccountInfo,
    ConnectSettings,
    CoreEventMessage,
    CoreRequestMessage,
    MethodResponseMessage,
} from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { createLazy } from '@trezor/utils';

import { CoreInModule } from './core-in-module';

type CoreEventListener = (message: CoreEventMessage) => void;
type CreateCoreResponse = (id: string) => MethodResponseMessage;

// The Core stand-in answers every call with `createCoreResponse` and keeps what it emitted, so the
// test can compare the response returned by call() with the very objects Core still holds.
let createCoreResponse: CreateCoreResponse;
const emittedMessages: MethodResponseMessage[] = [];

const mockInitCoreState = () =>
    createLazy((_settings: ConnectSettings, onCoreEvent: CoreEventListener) =>
        Promise.resolve({
            handleMessage: (message: CoreRequestMessage) => {
                if (message.type !== CORE_CALL) return;

                const response = createCoreResponse(message.id);
                emittedMessages.push(response);
                queueMicrotask(() => onCoreEvent(response));
            },
        }),
    );

jest.mock('../core', () => ({ initCoreState: () => mockInitCoreState() }));

class TestCoreInModule extends CoreInModule {
    protected defaultTransports() {
        return [];
    }
}

const manifest = {
    appName: 'core-in-module test',
    appUrl: 'https://example.com',
    email: 'test@example.com',
};

const device = { path: asDeviceUniquePath('1'), instance: 0, state: { sessionId: 'session-id' } };

const path = "m/84'/0'/0'/0/0";

const accountInfo: AccountInfo = {
    descriptor: 'descriptor',
    balance: '1000',
    availableBalance: '1000',
    empty: false,
    history: { total: 1, unconfirmed: 0 },
    addresses: {
        change: [],
        used: [
            { address: 'address', path, transfers: 1, balance: '0', sent: '0', received: '1000' },
        ],
        unused: [],
    },
    utxo: [
        {
            txid: 'txid',
            vout: 0,
            confirmations: 1,
            address: 'address',
            path,
            amount: '1000',
            blockHeight: 1,
        },
    ],
    page: { index: 1, size: 25, total: 1 },
};

const collectObjects = (value: unknown, objects = new Set<object>()) => {
    if (typeof value === 'object' && value !== null && !objects.has(value)) {
        objects.add(value);
        Object.values(value).forEach(child => collectObjects(child, objects));
    }

    return objects;
};

describe('CoreInModule', () => {
    beforeEach(() => {
        emittedMessages.length = 0;
    });

    it.each<{ description: string; createResponse: CreateCoreResponse }>([
        {
            description: 'success',
            createResponse: id => createResponseMessage(id, true, accountInfo, device),
        },
        {
            description: 'error',
            createResponse: id =>
                createResponseMessage(id, false, ERRORS.TypedError('Device_NotFound'), device),
        },
    ])(
        'call() returns the $description response without sharing objects with the message Core emitted',
        async ({ createResponse }) => {
            createCoreResponse = createResponse;
            const connect = new TestCoreInModule();
            await connect.init({ manifest });

            const response = await connect.call({
                method: 'getAccountInfo',
                coin: 'btc',
                descriptor: 'descriptor',
            });

            expect([response]).toEqual(
                emittedMessages.map(({ event, type, ...emittedResponse }) => emittedResponse),
            );

            const emittedObjects = collectObjects(emittedMessages);
            const sharedObjects = [...collectObjects(response)].filter(object =>
                emittedObjects.has(object),
            );
            expect(sharedObjects).toEqual([]);

            connect.dispose();
        },
    );
});
