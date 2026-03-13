import { showErrorModal } from '../showErrorModal';

const LAYER_ID = 'TrezorConnectInteractionLayer';

describe('showErrorModal', () => {
    afterEach(() => {
        const host = document.getElementById(LAYER_ID);
        if (host) host.remove();
    });

    it('creates an overlay element with the error message in a shadow root', () => {
        const callbacks = { onRetry: jest.fn(), onCancel: jest.fn() };
        const remove = showErrorModal('Test error', callbacks);

        expect(remove).toBeDefined();

        const host = document.getElementById(LAYER_ID);
        expect(host).toBeTruthy();
        expect(host?.shadowRoot).toBeTruthy();

        const paragraph = host?.shadowRoot?.querySelector('.trezorconnect-body p');
        expect(paragraph?.textContent).toBe('Test error');
    });

    it('returns undefined when the overlay already exists', () => {
        const callbacks = { onRetry: jest.fn(), onCancel: jest.fn() };
        const first = showErrorModal('First', callbacks);
        expect(first).toBeDefined();

        const second = showErrorModal('Second', callbacks);
        expect(second).toBeUndefined();
    });

    it('calls onRetry and removes the overlay when the retry button is clicked', () => {
        const callbacks = { onRetry: jest.fn(), onCancel: jest.fn() };
        showErrorModal('Error', callbacks);

        const host = document.getElementById(LAYER_ID);
        const button = host?.shadowRoot?.querySelector('.trezorconnect-open');
        expect(button).toBeTruthy();
        button?.dispatchEvent(new Event('click'));

        expect(callbacks.onRetry).toHaveBeenCalledTimes(1);
        expect(callbacks.onCancel).not.toHaveBeenCalled();
        expect(document.getElementById(LAYER_ID)).toBeNull();
    });

    it('calls onCancel and removes the overlay when the close button is clicked', () => {
        const callbacks = { onRetry: jest.fn(), onCancel: jest.fn() };
        showErrorModal('Error', callbacks);

        const host = document.getElementById(LAYER_ID);
        const close = host?.shadowRoot?.querySelector('.trezorconnect-close');
        expect(close).toBeTruthy();
        close?.dispatchEvent(new Event('click'));

        expect(callbacks.onCancel).toHaveBeenCalledTimes(1);
        expect(callbacks.onRetry).not.toHaveBeenCalled();
        expect(document.getElementById(LAYER_ID)).toBeNull();
    });

    it('can be removed via the returned function', () => {
        const callbacks = { onRetry: jest.fn(), onCancel: jest.fn() };
        const remove = showErrorModal('Error', callbacks);

        expect(document.getElementById(LAYER_ID)).toBeTruthy();
        expect(remove).toBeDefined();
        if (remove) remove();
        expect(document.getElementById(LAYER_ID)).toBeNull();
    });

    it('allows creating a new overlay after the previous one is removed', () => {
        const callbacks = { onRetry: jest.fn(), onCancel: jest.fn() };
        const remove = showErrorModal('First', callbacks);
        expect(remove).toBeDefined();
        if (remove) remove();

        const second = showErrorModal('Second', callbacks);
        expect(second).toBeDefined();

        const host = document.getElementById(LAYER_ID);
        const paragraph = host?.shadowRoot?.querySelector('.trezorconnect-body p');
        expect(paragraph?.textContent).toBe('Second');
    });
});
