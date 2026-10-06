import { createHash } from 'crypto';

import type { UiResponseThpPairingTag } from '@trezor/connect-common';
import { parseConnectSettings } from '@trezor/connect-common/src/data/connectSettings';
import { ThpPairingMethod, thp as protocolThp } from '@trezor/protocol';
import type { MessageResponse } from '@trezor/transport-common';

import { thpPairing } from './pairing';
import * as settingsStore from '../../data/settingsStore';
import type { IDevice } from '../../types/idevice';

const handshakeHash = Buffer.alloc(32, 1);
const qrCodeSecret = '00'.repeat(16);
const qrCodeTag = createHash('sha256')
    .update(Buffer.from([ThpPairingMethod.QrCode]))
    .update(handshakeHash)
    .update(Buffer.from(qrCodeSecret, 'hex'))
    .digest()
    .subarray(0, 16)
    .toString('hex');

const createDevice = (
    pairingMethods: ThpPairingMethod[],
    replies: Record<string, MessageResponse[]>,
    uiResponses: UiResponseThpPairingTag['payload'][] = [],
) => {
    const thpState = new protocolThp.ThpState();
    thpState.updateHandshakeCredentials({ pairingMethods, handshakeHash });
    thpState.setPhase('pairing');

    const sent: string[] = [];
    const session = {
        call: (name: string) => {
            sent.push(name);
            const payload = replies[name]?.shift();
            if (!payload) {
                return Promise.reject(new Error(`No reply for ${name}`));
            }

            return Promise.resolve({ success: true, payload });
        },
        // The device does not cancel while the host waits for the pairing tag.
        receive: ({ signal }: { signal: AbortSignal }) =>
            new Promise(resolve => {
                signal.addEventListener('abort', () =>
                    resolve({ success: false, error: new Error('aborted') }),
                );
            }),
    };
    const prompt = jest.fn(() => Promise.resolve({ success: true, payload: uiResponses.shift() }));
    const device = {
        getThpState: () => thpState,
        getCurrentSession: () => session,
        emit: jest.fn(),
        prompt,
    } as unknown as IDevice;

    return { device, thpState, sent, prompt };
};

const codeEntryReplies = (): Record<string, MessageResponse[]> => ({
    ThpPairingRequest: [{ type: 'ThpPairingRequestApproved', message: {} }],
    ThpCodeEntryChallenge: [
        {
            type: 'ThpCodeEntryCpaceTrezor',
            message: { cpace_trezor_public_key: '00'.repeat(32) },
        },
    ],
    ThpCredentialRequest: [
        {
            type: 'ThpCredentialResponse',
            message: { trezor_static_public_key: '00'.repeat(32), credential: '00' },
        },
    ],
    ThpEndRequest: [{ type: 'ThpEndResponse', message: {} }],
});

describe('thpPairing', () => {
    beforeEach(() => {
        settingsStore.set(
            parseConnectSettings({
                thp: { hostName: 'host', appName: 'app', pairingMethods: [], knownCredentials: [] },
            }),
        );
    });

    it('completes SkipPairing when the device ends pairing', async () => {
        const { device, thpState, sent } = createDevice([ThpPairingMethod.SkipPairing], {
            ThpPairingRequest: [{ type: 'ThpPairingRequestApproved', message: {} }],
            ThpSelectMethod: [{ type: 'ThpEndResponse', message: {} }],
        });

        await thpPairing(device);

        expect(thpState.phase).toBe('paired');
        expect(sent).toEqual(['ThpPairingRequest', 'ThpSelectMethod']);
    });

    it('does not end pairing for a method other than SkipPairing', async () => {
        const { device, thpState, sent } = createDevice([ThpPairingMethod.CodeEntry], {
            ...codeEntryReplies(),
            ThpSelectMethod: [{ type: 'ThpEndResponse', message: {} }],
        });

        await expect(thpPairing(device)).rejects.toMatchObject({
            code: 'Device_ThpPairingMethodsException',
        });
        expect(thpState.phase).toBe('pairing');
        expect(sent).toEqual(['ThpPairingRequest', 'ThpSelectMethod']);
    });

    it('does not request credentials when the selected method is not prepared', async () => {
        const { device, thpState, sent } = createDevice([ThpPairingMethod.CodeEntry], {
            ...codeEntryReplies(),
            ThpSelectMethod: [{ type: 'ThpPairingRequestApproved', message: {} }],
        });

        await expect(thpPairing(device)).rejects.toMatchObject({ code: 'Runtime' });
        expect(thpState.phase).toBe('pairing');
        expect(sent).not.toContain('ThpCredentialRequest');
    });

    describe('method change', () => {
        const createDeviceWithQrCodeSecret = (secret: string) =>
            createDevice(
                [ThpPairingMethod.CodeEntry, ThpPairingMethod.QrCode],
                {
                    ...codeEntryReplies(),
                    ThpSelectMethod: [
                        {
                            type: 'ThpCodeEntryCommitment',
                            message: { commitment: '00'.repeat(32) },
                        },
                        { type: 'ThpPairingPreparationsFinished', message: {} },
                    ],
                    ThpQrCodeTag: [{ type: 'ThpQrCodeSecret', message: { secret } }],
                },
                [{ selectedMethod: 'QrCode' }, { tag: qrCodeTag }],
            );

        it('checks the tag of the newly selected method before credentials', async () => {
            const { device, thpState, sent, prompt } = createDeviceWithQrCodeSecret(qrCodeSecret);

            await thpPairing(device);

            expect(thpState.phase).toBe('paired');
            expect(prompt).toHaveBeenCalledTimes(2);
            expect(sent.slice(-4)).toEqual([
                'ThpSelectMethod',
                'ThpQrCodeTag',
                'ThpCredentialRequest',
                'ThpEndRequest',
            ]);
        });

        it('does not pair when the tag of the newly selected method does not match', async () => {
            const { device, thpState, sent } = createDeviceWithQrCodeSecret('11'.repeat(16));

            await expect(thpPairing(device)).rejects.toThrow('code mismatch');
            expect(thpState.phase).toBe('pairing');
            expect(sent).not.toContain('ThpCredentialRequest');
        });
    });
});
