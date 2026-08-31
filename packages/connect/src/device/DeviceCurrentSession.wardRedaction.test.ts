import type { Session, Transport } from '@trezor/transport-common';

import { DeviceCurrentSession } from './DeviceCurrentSession';
import type { IDevice } from '../types/idevice';

// WARD payloads carry user secrets (entry value, plaintext leaf content, restore-capable MAC) and
// the labels that key them (app_id/identifier/entry_key). DeviceCurrentSession.call() logs every
// message it sends and receives, so those must be redacted there -- the same guard the blacklist
// already gives PassphraseAck.passphrase and CipheredKeyValue.value. This pins that redaction at the
// call boundary rather than trusting each new WARD message to remember to opt in.

const setup = () => {
    const debug = jest.fn();
    let next: { type: string; message: any } | undefined;

    const transport = {
        deviceEvents: { once: () => {} },
        call: () =>
            Promise.resolve(
                next
                    ? { success: true as const, payload: next }
                    : { success: false as const, error: { code: 'unexpected-call' } },
            ),
    } as unknown as Transport;

    const device = {
        transportPath: 'path',
        protocol: undefined,
        features: { session_id: 'session-id', unlocked: true },
        getThpState: () => undefined,
    } as unknown as IDevice;

    const session = new DeviceCurrentSession(device, transport, '1' as Session, {
        debug,
        warn: () => {},
    } as any);

    const respondWith = (response: { type: string; message: any }) => {
        next = response;
    };

    // Everything the debug logger ever saw, flattened into one searchable string.
    const loggedText = () => JSON.stringify(debug.mock.calls);

    return { session, respondWith, loggedText };
};

describe('DeviceCurrentSession: WARD log redaction', () => {
    it('redacts the secret value on the way out and the leaf content on the way back', async () => {
        const { session, respondWith, loggedText } = setup();
        respondWith({
            type: 'WardLeafAck',
            message: {
                entry_key: 'aa',
                counter: 1,
                mac: 'MAC_SECRET',
                content: { plaintext: { content: 'LEAF_SECRET' } },
            },
        });

        await session.typedCall('WardSetEntry', ['WardLeafAck', 'WardMutationApplied'], {
            app_id: 'MyApp',
            identifier: 'my-login',
            value: 'ENTRY_SECRET',
        });

        const text = loggedText();
        // Nothing confidential reached the logger...
        expect(text).not.toContain('ENTRY_SECRET');
        expect(text).not.toContain('my-login');
        expect(text).not.toContain('MyApp');
        expect(text).not.toContain('LEAF_SECRET');
        expect(text).not.toContain('MAC_SECRET');
        // ...and the redaction marker did.
        expect(text).toContain('(redacted...)');
    });

    it('keeps non-secret routing fields while redacting the keyed identity', async () => {
        const { session, respondWith, loggedText } = setup();
        respondWith({
            type: 'WardFlushQueueApplied',
            message: { entry_key: 'KEY_PATH_SECRET', counter: 5, remaining: 2 },
        });

        await session.typedCall('WardFlushQueue', ['WardFlushQueueAck', 'WardFlushQueueApplied'], {
            app_id: 'MyApp',
            identifier: 'my-login',
        });

        const text = loggedText();
        expect(text).not.toContain('KEY_PATH_SECRET');
        expect(text).not.toContain('my-login');
        // Routing fields survive, so the draining loop stays debuggable.
        expect(text).toContain('"remaining":2');
        expect(text).toContain('"counter":5');
    });
});
