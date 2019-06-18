/* @flow */

import { describe, it } from 'mocha';
import { expect } from 'chai';
import { CustomError } from '../src/constants/errors';

describe('Custom errors', () => {
    it('Error with predefined code and predefined message', async () => {
        const error = new CustomError('worker_not_found');
        expect(error.code).equals('blockchain_link/worker_not_found');
        expect(error.message).equals('Worker not found');
    });

    it('Error with predefined code and custom message', async () => {
        const error = new CustomError('worker_not_found', 'Custom message');
        expect(error.code).equals('blockchain_link/worker_not_found');
        expect(error.message).equals('Custom message');
    });

    it('Error already prefixed code', async () => {
        const error = new CustomError('blockchain_link/worker_not_found');
        expect(error.code).equals('blockchain_link/worker_not_found');
        expect(error.message).equals('Worker not found');
    });

    it('Error with custom code and custom message', async () => {
        const error = new CustomError('blockchain_link/custom', 'Custom message');
        expect(error.code).equals('blockchain_link/custom');
        expect(error.message).equals('Custom message');
    });

    it('Error with custom code and without message', async () => {
        const error = new CustomError('custom');
        expect(error.code).equals('blockchain_link/custom');
        expect(error.message).equals('Message not set');
    });

    it('Error without code and with custom message', async () => {
        // $FlowIssue
        const error = new CustomError(null, 'Custom message');
        expect(error.code).equals(undefined);
        expect(error.message).equals('Custom message');
    });

    it('Error without code and without message', async () => {
        // $FlowIssue
        const error = new CustomError();
        expect(error.code).equals(undefined);
        expect(error.message).equals('Message not set');
    });
});
