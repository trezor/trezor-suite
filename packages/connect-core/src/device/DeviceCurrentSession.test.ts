import { Log } from '@trezor/logger';
import type { MessageResponse, Session, Transport } from '@trezor/transport-common';

import { DeviceCurrentSession } from './DeviceCurrentSession';
import type { IDevice } from '../types/idevice';

const createSession = (response: MessageResponse) => {
    // A disabled Log still keeps every record, which is how hosts create it by default.
    const logger = new Log('DeviceCommands', false);
    const sent: { name: string; data: unknown }[] = [];
    const transport = {
        deviceEvents: { once: () => {} },
        call: ({ name, data }: { name: string; data: unknown }) => {
            sent.push({ name, data });

            return Promise.resolve({ success: true, payload: response });
        },
    } as unknown as Transport;
    const device = {
        transportPath: 'path',
        getThpState: () => undefined,
    } as unknown as IDevice;
    const session = new DeviceCurrentSession(device, transport, '1' as Session, logger);
    const loggedText = () => JSON.stringify(logger.getLog().map(({ message }) => message));

    return { session, sent, loggedText };
};

const success: MessageResponse = { type: 'Success', message: { message: '' } };

describe('DeviceCurrentSession', () => {
    describe('device-call log', () => {
        it.each([
            {
                name: 'PassphraseAck',
                data: { passphrase: 'passphrase-value' },
                response: success,
                hidden: ['passphrase-value'],
                kept: [],
            },
            {
                name: 'PinMatrixAck',
                data: { pin: 'pin-value' },
                response: success,
                hidden: ['pin-value'],
                kept: [],
            },
            {
                name: 'WordAck',
                data: { word: 'word-value' },
                response: success,
                hidden: ['word-value'],
                kept: [],
            },
            {
                name: 'CipherKeyValue',
                data: { address_n: [], key: 'key-name', value: 'sent-value', encrypt: true },
                response: { type: 'CipheredKeyValue', message: { value: 'received-value' } },
                hidden: ['sent-value', 'received-value'],
                kept: ['"key":"key-name"'],
            },
            {
                name: 'EvoluGetNode',
                data: { proof_of_delegated_identity: 'proof-value' },
                response: { type: 'EvoluNode', message: { data: 'node-value' } },
                hidden: ['proof-value', 'node-value'],
                kept: [],
            },
            {
                name: 'EvoluGetDelegatedIdentityKey',
                data: { thp_credential: 'credential-value' },
                response: {
                    type: 'EvoluDelegatedIdentityKey',
                    message: { private_key: 'private-key-value' },
                },
                hidden: ['credential-value', 'private-key-value'],
                kept: [],
            },
            {
                name: 'ThpCreateNewSession',
                data: { passphrase: 'passphrase-value', derive_cardano: false },
                response: success,
                hidden: ['passphrase-value'],
                kept: ['"derive_cardano":false'],
            },
            {
                name: 'LoadDevice',
                data: { mnemonics: ['mnemonic-value'], pin: 'pin-value', label: 'label-value' },
                response: success,
                hidden: ['mnemonic-value', 'pin-value'],
                kept: ['"label":"label-value"'],
            },
        ] satisfies {
            name: string;
            data: Record<string, unknown>;
            response: MessageResponse;
            hidden: string[];
            kept: string[];
        }[])(
            'replaces key material and entered values of $name with a placeholder',
            async ({ name, data, response, hidden, kept }) => {
                const { session, sent, loggedText } = createSession(response);
                const sentData = structuredClone(data);

                await session.call(name, data);

                expect(sent).toEqual([{ name, data: sentData }]);
                const text = loggedText();
                expect(text).toContain(`"Sending","${name}"`);
                expect(text).toContain(`"Received","${response.type}"`);
                hidden.forEach(value => expect(text).not.toContain(value));
                kept.forEach(value => expect(text).toContain(value));
            },
        );
    });
});
