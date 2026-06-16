import { addEventListener } from '../src/addEventListener';

describe('addEventListener', () => {
    it('attaches the listener and dispatches events to it', () => {
        const handler = jest.fn();
        const target = new EventTarget();

        addEventListener(target, 'ping', handler);
        target.dispatchEvent(new Event('ping'));

        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('returns an idempotent disposer that removes the listener', () => {
        const handler = jest.fn();
        const target = new EventTarget();

        const dispose = addEventListener(target, 'ping', handler);
        target.dispatchEvent(new Event('ping'));
        dispose();
        target.dispatchEvent(new Event('ping'));

        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('disposer is idempotent — calling it multiple times does not throw', () => {
        const target = new EventTarget();
        const removeSpy = jest.spyOn(target, 'removeEventListener');

        const dispose = addEventListener(target, 'ping', () => {});
        dispose();
        dispose();
        dispose();

        expect(removeSpy).toHaveBeenCalledTimes(1);
    });

    it('respects the once option and the disposer remains safe to call', () => {
        const handler = jest.fn();
        const target = new EventTarget();

        const dispose = addEventListener(target, 'ping', handler, { once: true });
        target.dispatchEvent(new Event('ping'));
        target.dispatchEvent(new Event('ping'));

        expect(handler).toHaveBeenCalledTimes(1);
        expect(() => dispose()).not.toThrow();
    });

    it('forwards listener options through to removeEventListener (capture phase)', () => {
        const target = new EventTarget();
        const removeSpy = jest.spyOn(target, 'removeEventListener');
        const handler = () => {};
        const options = { capture: true };

        const dispose = addEventListener(target, 'ping', handler, options);
        dispose();

        expect(removeSpy).toHaveBeenCalledWith('ping', handler, options);
    });
});
