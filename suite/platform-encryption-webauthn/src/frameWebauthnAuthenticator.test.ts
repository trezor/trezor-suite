import { EncryptionUnavailable } from '@suite-common/platform-encryption';
import { createMockDeps } from '@trezor/dependency-injection';
import { err, ok } from '@trezor/type-utils';

import {
    type FrameWebauthnAuthenticatorDeps,
    createFrameWebauthnAuthenticator,
} from './frameWebauthnAuthenticator';
import { type WebauthnFrameHostDeps, startWebauthnFrameHost } from './webauthnFrameHost';

type Listener = (event: MessageEvent) => void;

const parentWindow = { name: 'parent' };
const frameWindow = { name: 'frame' };
const otherWindow = { name: 'other' };

const createMessageEvent = (data: unknown, source: object) =>
    ({ data, source, origin: 'http://localhost:21345' }) as unknown as MessageEvent;

/** Connects the authenticator in the parent document with the host running in the frame. */
const createConnectedFrame = () => {
    const parentListeners = new Set<Listener>();
    const frameListeners = new Set<Listener>();
    const dispatch = (listeners: Set<Listener>, event: MessageEvent) =>
        queueMicrotask(() => listeners.forEach(listener => listener(event)));
    const subscribe = (listeners: Set<Listener>) => (listener: Listener) => {
        listeners.add(listener);

        return () => {
            listeners.delete(listener);
        };
    };

    const hostDeps = createMockDeps<WebauthnFrameHostDeps>({
        webauthnAuthenticator: {
            createCredential: () =>
                Promise.resolve(ok({ credentialIdHex: 'abcd', isPrfEnabled: true })),
            evaluatePrf: params => Promise.resolve(ok(`${params.saltHex}ee`)),
        },
        addMessageListener: subscribe(frameListeners),
        isParentMessage: event => event.source === parentWindow,
        postToParent: response =>
            dispatch(parentListeners, createMessageEvent(response, frameWindow)),
    });

    const clientDeps = createMockDeps<FrameWebauthnAuthenticatorDeps>({
        loadFrame: () => Promise.resolve(),
        activateFrame: () => Promise.resolve(true),
        postToFrame: request => dispatch(frameListeners, createMessageEvent(request, parentWindow)),
        addMessageListener: subscribe(parentListeners),
        isFrameMessage: event => event.source === frameWindow,
    });

    const stopHost = startWebauthnFrameHost(hostDeps);

    return {
        hostDeps,
        stopHost,
        clientDeps,
        sendToFrame: (data: unknown, source: object) =>
            dispatch(frameListeners, createMessageEvent(data, source)),
        sendToParent: (data: unknown, source: object) =>
            dispatch(parentListeners, createMessageEvent(data, source)),
    };
};

describe(createFrameWebauthnAuthenticator.name, () => {
    it('activates the frame and creates the credential there', async () => {
        const { hostDeps, clientDeps } = createConnectedFrame();

        const result = await createFrameWebauthnAuthenticator(clientDeps).createCredential();

        expect(result).toEqual(ok({ credentialIdHex: 'abcd', isPrfEnabled: true }));
        expect(clientDeps.activateFrame).toHaveBeenCalledTimes(1);
        expect(hostDeps.webauthnAuthenticator.createCredential).toHaveBeenCalledTimes(1);
    });

    it('does not ask the frame when it cannot be activated', async () => {
        const { hostDeps, clientDeps } = createConnectedFrame();
        clientDeps.activateFrame.mockResolvedValue(false);

        const result = await createFrameWebauthnAuthenticator(clientDeps).createCredential();

        expect(result).toEqual(
            err(EncryptionUnavailable('The WebAuthn frame could not be activated')),
        );
        expect(hostDeps.webauthnAuthenticator.createCredential).not.toHaveBeenCalled();
    });

    it('evaluates the PRF in the frame without activating it', async () => {
        const { hostDeps, clientDeps } = createConnectedFrame();
        const params = { credentialIdHex: 'abcd', saltHex: 'ff00' };

        const result = await createFrameWebauthnAuthenticator(clientDeps).evaluatePrf(params);

        expect(result).toEqual(ok('ff00ee'));
        expect(hostDeps.webauthnAuthenticator.evaluatePrf).toHaveBeenCalledWith(params);
        expect(clientDeps.activateFrame).not.toHaveBeenCalled();
    });

    it('matches concurrent responses to their requests', async () => {
        const { clientDeps } = createConnectedFrame();
        const authenticator = createFrameWebauthnAuthenticator(clientDeps);

        const results = await Promise.all([
            authenticator.evaluatePrf({ credentialIdHex: 'abcd', saltHex: '01' }),
            authenticator.evaluatePrf({ credentialIdHex: 'abcd', saltHex: '02' }),
        ]);

        expect(results).toEqual([ok('01ee'), ok('02ee')]);
    });

    it('ignores responses that do not come from the frame', async () => {
        const { clientDeps, sendToParent } = createConnectedFrame();
        clientDeps.postToFrame.mockImplementation(request =>
            sendToParent(
                {
                    type: 'trezor-suite/webauthn-frame-response',
                    id: request.id,
                    result: ok('00'),
                },
                otherWindow,
            ),
        );
        const authenticator = createFrameWebauthnAuthenticator(clientDeps);

        const result = await Promise.race([
            authenticator.evaluatePrf({ credentialIdHex: 'abcd', saltHex: '01' }),
            new Promise(resolve => setTimeout(() => resolve('pending'), 10)),
        ]);

        expect(result).toBe('pending');
    });
});

describe(startWebauthnFrameHost.name, () => {
    it('ignores requests that do not come from the parent document', async () => {
        const { hostDeps, sendToFrame } = createConnectedFrame();

        sendToFrame(
            { type: 'trezor-suite/webauthn-frame-request', id: 0, method: 'createCredential' },
            otherWindow,
        );
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(hostDeps.webauthnAuthenticator.createCredential).not.toHaveBeenCalled();
        expect(hostDeps.postToParent).not.toHaveBeenCalled();
    });

    it('ignores malformed requests', async () => {
        const { hostDeps, sendToFrame } = createConnectedFrame();

        sendToFrame(
            {
                type: 'trezor-suite/webauthn-frame-request',
                id: 0,
                method: 'evaluatePrf',
                params: { credentialIdHex: 'abcd', saltHex: 'not hex' },
            },
            parentWindow,
        );
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(hostDeps.webauthnAuthenticator.evaluatePrf).not.toHaveBeenCalled();
    });

    it('stops answering once stopped', async () => {
        const { hostDeps, stopHost, sendToFrame } = createConnectedFrame();
        stopHost();

        sendToFrame(
            { type: 'trezor-suite/webauthn-frame-request', id: 0, method: 'createCredential' },
            parentWindow,
        );
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(hostDeps.webauthnAuthenticator.createCredential).not.toHaveBeenCalled();
    });
});
