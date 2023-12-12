import { CustomError } from '@trezor/blockchain-link-types/lib/constants/errors';

describe('Custom errors', () => {
    it('Error with predefined code and predefined message', () => {
        const error = new CustomError('worker_not_found');
        expect(error.code).toBe('blockchain_link/worker_not_found');
        expect(error.message).toBe('Worker not found');
    });

    it('Error with predefined code and custom message', () => {
        const error = new CustomError('worker_not_found', 'Custom message');
        expect(error.code).toBe('blockchain_link/worker_not_found');
        expect(error.message).toBe('Custom message');
    });

    it('Error already prefixed code', () => {
        const error = new CustomError('blockchain_link/worker_not_found');
        expect(error.code).toBe('blockchain_link/worker_not_found');
        expect(error.message).toBe('Worker not found');
    });

    it('Error with custom code and custom message', () => {
        const error = new CustomError('blockchain_link/custom', 'Custom message');
        expect(error.code).toBe('blockchain_link/custom');
        expect(error.message).toBe('Custom message');
    });

    it('Error with custom code and without message', () => {
        const error = new CustomError('custom');
        expect(error.code).toBe('blockchain_link/custom');
        expect(error.message).toBe('Message not set');
    });

    it('Error without code and with custom message', () => {
        // @ts-expect-error invalid param
        const error = new CustomError(null, 'Custom message');
        expect(error.code).toBe(undefined);
        expect(error.message).toBe('Custom message');
    });

    it('Error without code and without message', () => {
        // @ts-expect-error invalid param
        const error = new CustomError();
        expect(error.code).toBe(undefined);
        expect(error.message).toBe('Message not set');
    });
});
