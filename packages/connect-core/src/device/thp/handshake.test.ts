import { parseConnectSettings } from '@trezor/connect-common/src/data/connectSettings';
import { thp as protocolThp } from '@trezor/protocol';
import type { MessageResponse } from '@trezor/transport-common';

import { thpHandshake } from './handshake';
import * as settingsStore from '../../data/settingsStore';
import type { IDevice } from '../../types/idevice';

jest.mock('@trezor/protocol', () => {
    const actual = jest.requireActual('@trezor/protocol');

    return { ...actual, thp: { ...actual.thp, handleHandshakeInit: jest.fn() } };
});

const credentials: protocolThp.ThpCredentials = {
    trezor_static_public_key: '00'.repeat(32),
    host_static_key: '00'.repeat(32),
    credential: 'abcd',
    autoconnect: true,
};

const createDevice = (state: 0 | 1 | 2, presentedCredentials?: protocolThp.ThpCredentials) => {
    jest.mocked(protocolThp.handleHandshakeInit).mockReturnValue({
        trezorMaskedStaticPubkey: Buffer.alloc(32),
        trezorEncryptedStaticPubkey: Buffer.alloc(48),
        hostEncryptedStaticPubkey: Buffer.alloc(48),
        hostKey: Buffer.alloc(32),
        trezorKey: Buffer.alloc(32),
        handshakeHash: Buffer.alloc(32),
        staticKey: Buffer.alloc(32),
        hostStaticKeys: { publicKey: Buffer.alloc(32), privateKey: Buffer.alloc(32) },
        encryptedPayload: Buffer.alloc(32),
        allCredentials: presentedCredentials ? [presentedCredentials] : [],
        credentials: presentedCredentials,
    });

    const thpState = new protocolThp.ThpState();
    thpState.updateHandshakeCredentials({ handshakeHash: Buffer.alloc(32) });

    const replies: Record<string, MessageResponse> = {
        ThpHandshakeInitRequest: {
            type: 'ThpHandshakeInitResponse',
            message: {
                trezorEphemeralPubkey: Buffer.alloc(32),
                trezorEncryptedStaticPubkey: Buffer.alloc(48),
                tag: Buffer.alloc(16),
            },
        },
        ThpHandshakeCompletionRequest: {
            type: 'ThpHandshakeCompletionResponse',
            message: { state },
        },
        ThpEndRequest: { type: 'ThpEndResponse', message: {} },
    };
    const sent: string[] = [];
    const session = {
        call: (name: string) => {
            sent.push(name);

            return Promise.resolve({ success: true, payload: replies[name] });
        },
    };
    const device = {
        getThpState: () => thpState,
        getCurrentSession: () => session,
    } as unknown as IDevice;

    return { device, thpState, sent };
};

describe('thpHandshake', () => {
    beforeEach(() => {
        settingsStore.set(
            parseConnectSettings({
                thp: { pairingMethods: [], knownCredentials: [credentials] },
            }),
        );
    });

    it.each([1, 2] as const)(
        'rejects paired state %s when no credential was presented',
        async state => {
            const { device, thpState, sent } = createDevice(state);

            await expect(thpHandshake(device)).rejects.toMatchObject({
                code: 'Runtime',
            });
            expect(thpState.isPaired).toBe(false);
            expect(thpState.phase).not.toBe('paired');
            expect(sent).not.toContain('ThpEndRequest');
        },
    );

    it('finishes the handshake when a presented autoconnect credential is accepted', async () => {
        const { device, thpState, sent } = createDevice(1, credentials);

        await thpHandshake(device);

        expect(thpState.phase).toBe('paired');
        expect(sent).toContain('ThpEndRequest');
    });

    it('starts pairing when a presented autoconnect credential is not accepted', async () => {
        const { device, thpState, sent } = createDevice(0, credentials);

        await thpHandshake(device);

        expect(thpState.isPaired).toBe(false);
        expect(thpState.phase).toBe('pairing');
        expect(sent).not.toContain('ThpEndRequest');
        expect(settingsStore.get('thp')?.knownCredentials).toEqual([]);
    });
});
