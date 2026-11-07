import EventEmitter from 'events';

import { type CoreEventMessage, POPUP } from '@trezor/connect-common/src/events';
import type { AbstractMessageChannel } from '@trezor/connect-common/src/messageChannel/abstract';
import { Log } from '@trezor/logger';

import { Popup } from './abstract';

const createFakeChannel = () =>
    Object.assign(new EventEmitter(), {
        isConnected: false,
        postMessage: jest.fn(),
        abortHandshake: jest.fn(),
        disconnect: jest.fn(),
        clear: jest.fn(),
        resolveMessagePromises: jest.fn(),
    });

type FakeChannel = ReturnType<typeof createFakeChannel>;

class TestPopup extends Popup {
    public openImpl: () => Promise<void> = () => Promise.resolve();

    protected createChannel(): AbstractMessageChannel<CoreEventMessage> {
        return createFakeChannel() as unknown as AbstractMessageChannel<CoreEventMessage>;
    }

    public get fakeChannel() {
        return this.channel as unknown as FakeChannel;
    }

    protected open() {
        return this.openImpl();
    }

    // Reports the failure twice, as WebPopup does for a bootstrap handshake error.
    public failOpen(reason: string) {
        this.handleOpenFailure(reason);
        this.handleOpenFailure(reason);

        return Promise.reject(new Error(reason));
    }

    protected closePopup() {}

    protected isOpen() {
        return Promise.resolve(false);
    }

    protected onReset() {}
}

const createPopup = () =>
    new TestPopup({
        manifest: { appName: 'test', email: 'test@test.com', appUrl: 'https://test.com' },
        popupSrc: 'https://suite.trezor.io/web/connect-popup',
        version: '9.0.0',
        logger: new Log('Popup', false),
    });

const loadCore = (popup: TestPopup) =>
    popup.fakeChannel.emit('message', { type: POPUP.CORE_LOADED });

describe('Popup', () => {
    it('resolves the handshake once the core in the popup is loaded', async () => {
        const popup = createPopup();

        await popup.focusOrCreate();
        loadCore(popup);

        await expect(popup.handshakePromise?.promise).resolves.toBeUndefined();
    });

    it('rejects the handshake when the popup fails to open', async () => {
        const popup = createPopup();
        let handshake: Popup['handshakePromise'];
        popup.openImpl = () => {
            handshake = popup.handshakePromise;

            return popup.failOpen('popup-blocked');
        };

        await expect(popup.focusOrCreate()).rejects.toThrow('popup-blocked');
        await expect(handshake?.promise).rejects.toThrow('popup-blocked');
        expect(popup.handshakePromise).toBeUndefined();
    });

    it('does not reject the next handshake with a repeated open failure', async () => {
        const popup = createPopup();
        popup.openImpl = () => popup.failOpen('channel-handshake-error');
        await expect(popup.focusOrCreate()).rejects.toThrow('channel-handshake-error');

        popup.openImpl = () => Promise.resolve();
        await popup.focusOrCreate();
        loadCore(popup);

        await expect(popup.handshakePromise?.promise).resolves.toBeUndefined();
    });

    it('reports a closed popup once', async () => {
        const popup = createPopup();
        const onClosed = jest.fn();
        popup.on(POPUP.CLOSED, onClosed);
        await popup.focusOrCreate();

        popup.fakeChannel.emit('message', { type: POPUP.CLOSED });
        popup.fakeChannel.emit('message', { type: POPUP.CLOSED });
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(onClosed).toHaveBeenCalledTimes(1);
    });
});
