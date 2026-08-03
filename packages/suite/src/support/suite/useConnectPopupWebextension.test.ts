import { resolveWebextHashUpdate } from './useConnectPopupWebextension';

const LEGIT = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const ATTACKER = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

const encodeMessage = (message: unknown) =>
    `#extension-id=${LEGIT}&message=${encodeURIComponent(JSON.stringify(message))}`;

describe(resolveWebextHashUpdate.name, () => {
    it('binds the first extension id seen when none is bound yet', () => {
        const result = resolveWebextHashUpdate(`#extension-id=${LEGIT}`, null);

        expect(result).toEqual({ extensionIdToBind: LEGIT, message: null, reject: false });
    });

    it('does not re-bind when the same id arrives again', () => {
        const result = resolveWebextHashUpdate(`#extension-id=${LEGIT}`, LEGIT);

        expect(result).toEqual({ extensionIdToBind: null, message: null, reject: false });
    });

    it('rejects a hash update carrying a different extension id (route hijack)', () => {
        const hash = `#extension-id=${ATTACKER}&message=${encodeURIComponent(
            JSON.stringify({ id: 1, type: 'x' }),
        )}`;
        const result = resolveWebextHashUpdate(hash, LEGIT);

        // The attacker id AND its accompanying message are dropped.
        expect(result).toEqual({ extensionIdToBind: null, message: null, reject: true });
    });

    it('rejects an attacker id even on the accompanying message payload', () => {
        const hash = `#extension-id=${ATTACKER}&message=${encodeURIComponent(
            JSON.stringify({ id: 2, type: 'CORE_CALL' }),
        )}`;
        const result = resolveWebextHashUpdate(hash, LEGIT);

        expect(result.reject).toBe(true);
        expect(result.message).toBeNull();
    });

    it('parses a message from the bound extension', () => {
        const message = { id: 3, type: 'CORE_CALL' };
        const result = resolveWebextHashUpdate(encodeMessage(message), LEGIT);

        expect(result).toEqual({ extensionIdToBind: null, message, reject: false });
    });

    it('binds and parses in one update on first load with a message', () => {
        const message = { id: 4, type: 'channel-handshake-request' };
        const result = resolveWebextHashUpdate(encodeMessage(message), null);

        expect(result).toEqual({ extensionIdToBind: LEGIT, message, reject: false });
    });

    it('rejects a malformed message instead of throwing', () => {
        const result = resolveWebextHashUpdate(`#extension-id=${LEGIT}&message=%7Bnot-json`, LEGIT);

        expect(result).toEqual({ extensionIdToBind: null, message: null, reject: true });
    });

    it('accepts a hash with a message but no extension id (already bound)', () => {
        const message = { id: 5, type: 'CORE_CALL' };
        const result = resolveWebextHashUpdate(
            `#message=${encodeURIComponent(JSON.stringify(message))}`,
            LEGIT,
        );

        expect(result).toEqual({ extensionIdToBind: null, message, reject: false });
    });
});
