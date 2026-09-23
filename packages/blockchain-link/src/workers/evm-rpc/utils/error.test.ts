import { InvalidInputRpcError, RpcRequestError } from 'viem';

import { CustomError } from '@trezor/blockchain-link-types';

import { toCustomError } from './error';

const rpcError = new RpcRequestError({
    body: {},
    error: { code: -32000, message: 'nonce too low' },
    url: 'https://rpc.example.com',
});

describe(toCustomError.name, () => {
    it('uses the reason returned by the node instead of the verbose viem message', () => {
        expect(rpcError.message).toContain('\n');
        expect(toCustomError(rpcError, 'fallback').message).toBe('nonce too low');
    });

    it('unwraps the reason from an error re-thrown by viem as a known rpc error', () => {
        expect(toCustomError(new InvalidInputRpcError(rpcError), 'fallback').message).toBe(
            'nonce too low',
        );
    });

    it('uses the message of a plain error', () => {
        expect(toCustomError(new Error('boom'), 'fallback').message).toBe('boom');
    });

    it('falls back for a thrown non-error', () => {
        expect(toCustomError('boom', 'fallback').message).toBe('fallback');
    });

    it('keeps an error that already is a CustomError', () => {
        const error = new CustomError('connect', 'All backends are down');

        expect(toCustomError(error, 'fallback')).toBe(error);
    });
});
