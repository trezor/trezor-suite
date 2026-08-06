/**
 * @jest-environment jsdom
 */

import { type CoreEventMessage } from '@trezor/connect-common/src/events';
import { type AbstractMessageChannel } from '@trezor/connect-common/src/messageChannel/abstract';

import { type Params, Popup } from './abstract';

const createMockChannel = () => ({
    on: jest.fn(),
    postMessage: jest.fn(),
    abortHandshake: jest.fn(),
    disconnect: jest.fn(),
    connect: jest.fn(),
    clear: jest.fn(),
    resolveMessagePromises: jest.fn(),
    clearPendingSends: jest.fn(),
    isConnected: false,
});

class TestPopup extends Popup {
    protected createChannel(): AbstractMessageChannel<CoreEventMessage> {
        return createMockChannel() as unknown as AbstractMessageChannel<CoreEventMessage>;
    }
    protected open(): Promise<void> {
        return Promise.resolve();
    }
    protected closePopup(): void {}
    protected isOpen(): Promise<boolean> {
        return Promise.resolve(false);
    }
    protected onReset(): void {}

    // Test helpers.
    lock(): void {
        (this as unknown as { locked: boolean }).locked = true;
    }
    failOpen(reason: string): void {
        this.handleOpenFailure(reason);
    }
}

const params = {
    popupSrc: 'https://suite.trezor.io/connect-popup',
    manifest: { appUrl: 'https://app.example', email: 'dev@example.com' },
    version: '1.0.0',
    logger: {
        enabled: false,
        error: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        log: jest.fn(),
    },
} as unknown as Params;

const settlement = async (promise: Promise<unknown>) => {
    let state = 'pending';
    promise.then(
        () => {
            state = 'resolved';
        },
        () => {
            state = 'rejected';
        },
    );
    await Promise.resolve();
    await Promise.resolve();

    return state;
};

describe('Popup.handleOpenFailure', () => {
    // Regression: a single failed open() can report the failure twice (iframe
    // `channel-handshake-error` + the awaited channel handshake rejecting). The
    // second report used to reject the handshakePromise that the first report's
    // reset() had just recreated (reset() early-returns the second time because
    // `locked` is already false), leaving it permanently rejected so every later
    // call() failed until a page reload.
    it('keeps a pending, usable handshakePromise after a double open-failure', async () => {
        const popup = new TestPopup(params);
        popup.lock();

        popup.failOpen('channel-handshake-error');
        popup.failOpen('handshake-timeout');

        const { handshakePromise } = popup;
        expect(handshakePromise).toBeDefined();
        expect(await settlement(handshakePromise!.promise)).toBe('pending');

        // The next call() resolves it via POPUP.CORE_LOADED.
        handshakePromise!.resolve();
        await expect(handshakePromise!.promise).resolves.toBeUndefined();
    });

    it('unlocks so the next open() can proceed', () => {
        const popup = new TestPopup(params);
        popup.lock();

        popup.failOpen('handshake-timeout');

        expect((popup as unknown as { locked: boolean }).locked).toBe(false);
    });
});
