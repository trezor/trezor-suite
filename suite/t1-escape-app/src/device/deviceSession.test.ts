import { createMockDeps } from '@trezor/dependency-injection';
import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { err, ok } from '@trezor/type-utils';

import {
    DeviceCallFailure,
    type DeviceLostReason,
    type DeviceSessionDeps,
    type TransportCall,
    type TransportCallParams,
    createDeviceSession,
} from './deviceSession';

type TransportResponse = Awaited<ReturnType<TransportCall>>;

const message = <T extends PROTO.MessageKey>(
    type: T,
    payload: PROTO.MessagePayload<T>,
): TransportResponse => ok({ type, message: payload } as PROTO.MessageResponse);

const PUBLIC_KEY: PROTO.PublicKey = {
    node: { depth: 3, fingerprint: 1, child_num: 2, chain_code: 'aa', public_key: 'bb' },
    xpub: 'xpub',
};

type SetupParams = {
    responses: TransportResponse[];
    pin?: string;
    passphrase?: string;
    lostReason?: () => DeviceLostReason | undefined;
};

const setup = ({ responses, pin, passphrase, lostReason }: SetupParams) => {
    const queue = [...responses];
    const sent: TransportCallParams[] = [];

    const deps = createMockDeps<DeviceSessionDeps>({
        transportCall: params => {
            sent.push(params);

            return Promise.resolve(
                queue.shift() ?? err({ code: 'no response scripted for this call' }),
            );
        },
        getDeviceLostReason: lostReason ?? (() => undefined),
        requestPin: () => Promise.resolve(pin),
        requestPassphrase: () => Promise.resolve(passphrase),
        onButtonRequest: () => undefined,
    });

    return { session: createDeviceSession(deps), deps, sent };
};

const getPublicKey = (session: ReturnType<typeof setup>['session']) =>
    session.call('GetPublicKey', 'PublicKey', { address_n: [1] });

describe('device session', () => {
    it('returns the expected response', async () => {
        const { session, sent } = setup({ responses: [message('PublicKey', PUBLIC_KEY)] });

        expect(await getPublicKey(session)).toEqual({
            success: true,
            payload: { type: 'PublicKey', message: PUBLIC_KEY },
        });
        expect(sent).toEqual([{ name: 'GetPublicKey', data: { address_n: [1] } }]);
    });

    it('acknowledges button requests and tells the app to prompt the user', async () => {
        const { session, deps, sent } = setup({
            responses: [
                message('ButtonRequest', { code: 'ButtonRequest_ConfirmOutput' }),
                message('ButtonRequest', { code: 'ButtonRequest_SignTx' }),
                message('PublicKey', PUBLIC_KEY),
            ],
        });

        expect((await getPublicKey(session)).success).toBe(true);
        expect(sent.map(({ name }) => name)).toEqual(['GetPublicKey', 'ButtonAck', 'ButtonAck']);
        expect(deps.onButtonRequest).toHaveBeenCalledTimes(2);
    });

    it('answers the PIN matrix request with the positions from the user', async () => {
        const { session, sent } = setup({
            responses: [
                message('PinMatrixRequest', { type: 'PinMatrixRequestType_Current' }),
                message('PublicKey', PUBLIC_KEY),
            ],
            pin: '7391',
        });

        expect((await getPublicKey(session)).success).toBe(true);
        expect(sent[1]).toEqual({ name: 'PinMatrixAck', data: { pin: '7391' } });
    });

    it('reports a wrong PIN and does not ask for it again on its own', async () => {
        const { session, deps, sent } = setup({
            responses: [
                message('PinMatrixRequest', { type: 'PinMatrixRequestType_Current' }),
                message('Failure', { code: 'Failure_PinInvalid', message: 'Invalid PIN' }),
            ],
            pin: '1111',
        });

        expect(await getPublicKey(session)).toEqual({
            success: false,
            error: { type: 'failure', code: 'Failure_PinInvalid', message: 'Invalid PIN' },
        });
        expect(deps.requestPin).toHaveBeenCalledTimes(1);
        expect(sent.map(({ name }) => name)).toEqual(['GetPublicKey', 'PinMatrixAck']);
    });

    it('cancels on the device when the user dismisses the PIN prompt', async () => {
        const { session, sent } = setup({
            responses: [
                message('PinMatrixRequest', { type: 'PinMatrixRequestType_Current' }),
                message('Failure', { code: 'Failure_PinCancelled' }),
            ],
        });

        expect(await getPublicKey(session)).toEqual({
            success: false,
            error: { type: 'cancelled', prompt: 'pin' },
        });
        expect(sent.map(({ name }) => name)).toEqual(['GetPublicKey', 'Cancel']);
    });

    it('refuses to enter a PIN when the device asks for a new one', async () => {
        const { session, deps, sent } = setup({
            responses: [
                message('PinMatrixRequest', { type: 'PinMatrixRequestType_NewFirst' }),
                message('Failure', { code: 'Failure_PinCancelled' }),
            ],
            pin: '1234',
        });

        expect(await getPublicKey(session)).toEqual({
            success: false,
            error: { type: 'unexpected-response', received: 'PinMatrixRequestType_NewFirst' },
        });
        expect(deps.requestPin).not.toHaveBeenCalled();
        expect(sent.map(({ name }) => name)).toEqual(['GetPublicKey', 'Cancel']);
    });

    it('answers the passphrase request, also with an empty passphrase', async () => {
        const { session, sent } = setup({
            responses: [message('PassphraseRequest', {}), message('PublicKey', PUBLIC_KEY)],
            passphrase: '',
        });

        expect((await getPublicKey(session)).success).toBe(true);
        expect(sent[1]).toEqual({ name: 'PassphraseAck', data: { passphrase: '' } });
    });

    it('handles the PIN and the passphrase prompt in one call', async () => {
        const { session, sent } = setup({
            responses: [
                message('PinMatrixRequest', { type: 'PinMatrixRequestType_Current' }),
                message('PassphraseRequest', {}),
                message('PublicKey', PUBLIC_KEY),
            ],
            pin: '12',
            passphrase: 'secret',
        });

        expect((await getPublicKey(session)).success).toBe(true);
        expect(sent.map(({ name }) => name)).toEqual([
            'GetPublicKey',
            'PinMatrixAck',
            'PassphraseAck',
        ]);
    });

    it('cancels on the device when no passphrase is provided', async () => {
        const { session, sent } = setup({
            responses: [
                message('PassphraseRequest', {}),
                message('Failure', { code: 'Failure_ActionCancelled' }),
            ],
        });

        expect(await getPublicKey(session)).toEqual({
            success: false,
            error: { type: 'cancelled', prompt: 'passphrase' },
        });
        expect(sent.map(({ name }) => name)).toEqual(['GetPublicKey', 'Cancel']);
    });

    it('returns a device failure with its code', async () => {
        const { session } = setup({
            responses: [message('Failure', { code: 'Failure_ActionCancelled' })],
        });

        expect(await getPublicKey(session)).toEqual({
            success: false,
            error: { type: 'failure', code: 'Failure_ActionCancelled', message: '' },
        });
    });

    it('rejects a response of an unexpected type', async () => {
        const { session } = setup({ responses: [message('Success', { message: 'ok' })] });

        expect(await getPublicKey(session)).toEqual({
            success: false,
            error: { type: 'unexpected-response', received: 'Success' },
        });
    });

    it.each([
        ['session not found', 'session-taken'],
        ['device disconnected during action', 'disconnected'],
        ['Network request failed', 'bridge-unreachable'],
    ])('treats the transport error "%s" as a lost device', async (code, reason) => {
        const { session } = setup({ responses: [err({ code })] });

        expect(await getPublicKey(session)).toEqual({
            success: false,
            error: { type: 'device-lost', reason },
        });
    });

    it('does not talk to a device that was already taken by another client', async () => {
        const { session, sent } = setup({
            responses: [message('PublicKey', PUBLIC_KEY)],
            lostReason: () => 'session-taken',
        });

        expect(await getPublicKey(session)).toEqual({
            success: false,
            error: { type: 'device-lost', reason: 'session-taken' },
        });
        expect(sent).toEqual([]);
    });

    it('distrusts a response that arrives after the device was taken', async () => {
        let isTaken = false;
        const { session, deps } = setup({
            responses: [message('ButtonRequest', {}), message('PublicKey', PUBLIC_KEY)],
            lostReason: () => (isTaken ? 'session-taken' : undefined),
        });
        deps.onButtonRequest.mockImplementation(() => {
            isTaken = true;
        });

        expect(await getPublicKey(session)).toEqual({
            success: false,
            error: { type: 'device-lost', reason: 'session-taken' },
        });
    });

    it('refuses a second call while one is running', async () => {
        const { session } = setup({ responses: [message('PublicKey', PUBLIC_KEY)] });

        const [first, second] = await Promise.all([getPublicKey(session), getPublicKey(session)]);

        expect(first.success).toBe(true);
        expect(second).toEqual({ success: false, error: { type: 'busy' } });
    });

    describe('typedCall', () => {
        it('resolves with the response like the helper of connect-core expects', async () => {
            const { session } = setup({ responses: [message('PublicKey', PUBLIC_KEY)] });

            expect(
                await session.typedCall('GetPublicKey', 'PublicKey', { address_n: [1] }),
            ).toEqual({ type: 'PublicKey', message: PUBLIC_KEY });
        });

        it('accepts any of several expected response types', async () => {
            const { session } = setup({ responses: [message('Success', { message: 'ok' })] });

            expect((await session.typedCall('GetPublicKey', ['PublicKey', 'Success'])).type).toBe(
                'Success',
            );
        });

        it('rejects with the call error', async () => {
            const { session } = setup({
                responses: [message('Failure', { code: 'Failure_ActionCancelled' })],
            });

            const rejection = await session
                .typedCall('GetPublicKey', 'PublicKey', { address_n: [1] })
                .catch((error: unknown) => error);

            expect(rejection).toBeInstanceOf(DeviceCallFailure);
            expect((rejection as DeviceCallFailure).callError).toEqual({
                type: 'failure',
                code: 'Failure_ActionCancelled',
                message: '',
            });
        });
    });
});
