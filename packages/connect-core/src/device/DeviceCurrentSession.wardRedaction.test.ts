import type { Session, Transport } from '@trezor/transport-common';

import { DeviceCurrentSession } from './DeviceCurrentSession';
import type { IDevice } from '../types/idevice';

// WARD payloads carry user secrets (the new value, the sealed leaf parts, restore-capable root MACs)
// and the labels that key them (app_id/address/entry_key). DeviceCurrentSession.call() logs every
// message it sends and receives, so those must be redacted there -- the same guard the blacklist
// already gives PassphraseAck.passphrase and CipheredKeyValue.value. This pins that redaction at the
// call boundary rather than trusting each new WARD message to remember to opt in.
// Ported from mroz22's test for the ward-draft messages.

const setup = () => {
    const debug = jest.fn();
    const responses: { type: string; message: any }[] = [];

    const transport = {
        deviceEvents: { once: () => {} },
        call: () => {
            const next = responses.shift();

            return Promise.resolve(
                next
                    ? { success: true as const, payload: next }
                    : { success: false as const, error: { code: 'unexpected-call' } },
            );
        },
    } as unknown as Transport;

    const device = {
        transportPath: 'path',
        protocol: undefined,
        features: { session_id: 'session-id', unlocked: true },
        getThpState: () => undefined,
    } as unknown as IDevice;

    const session = new DeviceCurrentSession(
        device,
        transport,
        '1' as Session,
        {
            debug,
            warn: () => {},
        } as any,
    );

    const respondWith = (...next: { type: string; message: any }[]) => {
        responses.push(...next);
    };

    // Everything the debug logger ever saw, flattened into one searchable string.
    const loggedText = () => JSON.stringify(debug.mock.calls);

    return { session, respondWith, loggedText };
};

describe('DeviceCurrentSession: WARD log redaction', () => {
    it('redacts the new value on the way out', async () => {
        const { session, respondWith, loggedText } = setup();
        respondWith({ type: 'WARDQueueUpdateAck', message: { pending_id: 1 } });

        await session.typedCall('WARDQueueUpdate', 'WARDQueueUpdateAck', {
            address: '6d792d6c6f67696e',
            new_value: 'ENTRY_SECRET',
            app_id: 'MyApp',
        });

        const text = loggedText();
        expect(text).not.toContain('ENTRY_SECRET');
        expect(text).not.toContain('6d792d6c6f67696e');
        expect(text).not.toContain('MyApp');
        expect(text).toContain('(redacted...)');
    });

    it('redacts the pulled entry_key, the served leaf and the sealed result', async () => {
        const { session, respondWith, loggedText } = setup();
        respondWith(
            { type: 'WARDProofRequest', message: { entry_key: 'KEY_PATH_SECRET' } },
            {
                type: 'WARDPerformUpdateAck',
                message: {
                    counter: 2,
                    mac: 'MAC_SECRET',
                    entry_key: 'KEY_PATH_SECRET',
                    content: { encoding: 1, plaintext: { content: 'NEW_LEAF_SECRET' } },
                },
            },
        );
        session.setWardProofCallback(() => ({
            proof: [],
            content: { encoding: 1, plaintext: { content: 'OLD_LEAF_SECRET' } },
        }));

        await session.typedCall('WARDPerformUpdate', 'WARDPerformUpdateAck', { pending_id: 1 });

        const text = loggedText();
        expect(text).not.toContain('KEY_PATH_SECRET');
        expect(text).not.toContain('OLD_LEAF_SECRET');
        expect(text).not.toContain('NEW_LEAF_SECRET');
        expect(text).not.toContain('MAC_SECRET');
    });

    it('keeps non-secret fields while redacting the root MAC', async () => {
        const { session, respondWith, loggedText } = setup();
        respondWith({
            type: 'WARDConfirmedByWMAck',
            message: { counter: 5, new_root: 'ab', root_mac: 'ROOT_MAC_SECRET' },
        });

        await session.typedCall('WARDConfirmedByWM', 'WARDConfirmedByWMAck', {
            counter: 5,
            mac: 'MAC_SECRET',
            wm_signature: 'cd',
        });

        const text = loggedText();
        expect(text).not.toContain('ROOT_MAC_SECRET');
        expect(text).not.toContain('MAC_SECRET');
        expect(text).toContain('"counter":5');
    });

    // The log blacklist replaces top-level fields only, and an output's contact fields sit in
    // `tx.output`, so the whole `tx` goes.
    it("redacts a signed output's contact fields", async () => {
        const { session, respondWith, loggedText } = setup();
        respondWith({ type: 'TxRequest', message: { request_type: 'TXFINISHED' } });

        await session.typedCall('TxAckOutput', 'TxRequest', {
            tx: {
                output: {
                    address: 'OUTPUT_ADDRESS_SECRET',
                    amount: '1000',
                    script_type: 'PAYTOADDRESS',
                    contact_pubkey: 'CONTACT_PUBKEY_SECRET',
                    contact_signature: 'CONTACT_SIGNATURE_SECRET',
                },
            },
        });

        const text = loggedText();
        expect(text).not.toContain('OUTPUT_ADDRESS_SECRET');
        expect(text).not.toContain('CONTACT_PUBKEY_SECRET');
        expect(text).not.toContain('CONTACT_SIGNATURE_SECRET');
        expect(text).toContain('(redacted...)');
    });

    it("redacts an attested address's identity key and signature", async () => {
        const { session, respondWith, loggedText } = setup();
        respondWith({
            type: 'Address',
            message: {
                address: 'tb1qexample',
                contact_signature: 'CONTACT_SIGNATURE_SECRET',
                contact_pubkey: 'CONTACT_PUBKEY_SECRET',
            },
        });

        await session.typedCall('GetAddress', 'Address', {
            address_n: [2147483732, 2147483649, 2147483648, 0, 0],
            show_display: true,
            contact_attestation: true,
        });

        const text = loggedText();
        expect(text).not.toContain('CONTACT_SIGNATURE_SECRET');
        expect(text).not.toContain('CONTACT_PUBKEY_SECRET');
    });
});
