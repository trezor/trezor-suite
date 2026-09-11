import { type CoreEventMessage } from '@trezor/connect-common/src/events';
import { AbstractMessageChannel } from '@trezor/connect-common/src/messageChannel/abstract';
import { initLog } from '@trezor/connect-common/src/utils/debug';

import { type Params, Popup } from './abstract';

// Channel without a peer: nothing is ever delivered, so a handshake only
// settles through the manager's own abortHandshake()/reset() paths.
class MockChannel extends AbstractMessageChannel<CoreEventMessage> {
    constructor() {
        super({
            sendFn: () => {},
            channel: { here: '@trezor/connect-web', peer: '@trezor/connect-popup' },
        });
    }

    connect(): void {
        this.isConnected = true;
    }

    disconnect(): void {
        this.isConnected = false;
    }
}

class TestPopup extends Popup {
    openCount = 0;

    protected createChannel(): AbstractMessageChannel<CoreEventMessage> {
        return new MockChannel();
    }

    protected open(): Promise<void> {
        this.openCount += 1;

        return Promise.resolve();
    }

    protected closePopup(): void {}

    protected isOpen(): Promise<boolean> {
        return Promise.resolve(false);
    }

    protected onReset(): void {}

    failOpen(reason: string): void {
        this.handleOpenFailure(reason);
    }
}

const createParams = (logger = initLog('test')): Params => ({
    popupSrc: 'https://suite.trezor.io/connect-popup',
    manifest: { appName: 'Test app', appUrl: 'https://app.example', email: 'dev@example.com' },
    version: '1.0.0',
    logger,
});

const getHandshakePromise = (popup: Popup) => {
    const { handshakePromise } = popup;
    if (!handshakePromise) throw new Error('handshakePromise is not set');

    return handshakePromise;
};

describe('Popup.handleOpenFailure', () => {
    it('rejects the pending handshake with the failure reason and unlocks the manager', async () => {
        const popup = new TestPopup(createParams());
        const abortHandshake = jest.spyOn(popup.channel, 'abortHandshake');
        await popup.focusOrCreate();
        const { promise: handshake } = getHandshakePromise(popup);

        popup.failOpen('handshake-timeout');

        await expect(handshake).rejects.toThrow('handshake-timeout');
        expect(abortHandshake).toHaveBeenCalledWith('handshake-timeout');

        // Unlocked: the next focusOrCreate() opens again instead of focusing.
        await popup.focusOrCreate();
        expect(popup.openCount).toBe(2);
    });

    // Regression: a failure reported again after reset() (a duplicate report
    // of the same open(), or a late webextension callback) used to reject the
    // handshakePromise that reset() had just recreated (reset() early-returns
    // the second time because `locked` is already false), leaving it
    // permanently rejected so every later call() failed until a page reload.
    it('keeps a usable handshakePromise when the same open() failure is reported twice', async () => {
        const logger = initLog('test');
        const debug = jest.spyOn(logger, 'debug');
        const popup = new TestPopup(createParams(logger));
        await popup.focusOrCreate();

        popup.failOpen('channel-handshake-error');
        popup.failOpen('handshake-timeout');

        expect(debug).toHaveBeenCalledWith(
            'Ignoring open failure after reset:',
            'handshake-timeout',
        );

        // The next call() resolves it via POPUP.CORE_LOADED; a permanently
        // rejected deferred would ignore resolve() and fail this.
        const handshakePromise = getHandshakePromise(popup);
        handshakePromise.resolve();
        await expect(handshakePromise.promise).resolves.toBeUndefined();
    });
});
