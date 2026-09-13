import { connectPopupErrorSummary } from './connectPopupErrorSummary';

// Fake confidential path — must never survive into the summary.
const CONFIDENTIAL_PATH = "m/84'/0'/7'/0/3";

describe('connectPopupErrorSummary', () => {
    it('summarizes to a leak-free { code, method } string — no message/stack body reaches the sink', () => {
        const result = connectPopupErrorSummary('getAddress', {
            message: `Derivation failed at ${CONFIDENTIAL_PATH}`,
            code: 'Failure_UnknownCode',
        });

        expect(result).toBe('{ code: Failure_UnknownCode, method: getAddress }');
    });

    it('never leaks a confidential path embedded in the error message', () => {
        // `res.error` shape: a serialized error whose message can carry app-influenced input.
        const result = connectPopupErrorSummary('getPublicKey', {
            message: `bad path ${CONFIDENTIAL_PATH}`,
            code: 'Method_InvalidParameter',
        });

        expect(result).not.toContain(CONFIDENTIAL_PATH);
        expect(result).toBe('{ code: Method_InvalidParameter, method: getPublicKey }');
    });

    it('never leaks a confidential path embedded in a thrown Error message or stack', () => {
        // The catch-block sites pass the raw thrown value (`unknown`).
        const error = new Error(`derivation error for ${CONFIDENTIAL_PATH}`);
        (error as Error & { code?: string }).code = 'Failure_ActionCancelled';

        const result = connectPopupErrorSummary('cardanoGetAddress', error);

        expect(result).not.toContain(CONFIDENTIAL_PATH);
        expect(result).toBe('{ code: Failure_ActionCancelled, method: cardanoGetAddress }');
    });

    it('falls back to Failure_UnknownCode for a codeless thrown error', () => {
        const result = connectPopupErrorSummary('getAddress', new Error('boom'));

        expect(result).toBe('{ code: Failure_UnknownCode, method: getAddress }');
    });

    it('falls back to Failure_UnknownCode for a non-Error payload without a code', () => {
        // A non-Error payload has no `code`, so the summary must still emit a safe constant.
        const result = connectPopupErrorSummary('getAddress', `bad path ${CONFIDENTIAL_PATH}`);

        expect(result).not.toContain(CONFIDENTIAL_PATH);
        expect(result).toBe('{ code: Failure_UnknownCode, method: getAddress }');
    });
});
