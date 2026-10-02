import type { ErrorEvent } from '@sentry/core';

import { dropAnonRpcClientLogs } from './dropAnonRpcClientLogs';

const ADDRESS = '0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3';

const asErrorEvent = (event: Partial<ErrorEvent>) => event as ErrorEvent;

// The shape Sentry's captureConsole integration gives a captured console call.
const mockConsoleEvent = (args: unknown[]) =>
    asErrorEvent({ logger: 'console', message: args.join(' '), extra: { arguments: args } });

describe('dropAnonRpcClientLogs', () => {
    it('drops a log the anon-rpc client wrote to the console', () => {
        const event = mockConsoleEvent(['[worker]', 'eth_getBalance', ADDRESS]);

        expect(dropAnonRpcClientLogs(event)).toBeNull();
    });

    it('drops it when the client logged an error object', () => {
        const event = mockConsoleEvent(['[worker]', new Error(`balance of ${ADDRESS}`)]);

        expect(dropAnonRpcClientLogs(event)).toBeNull();
    });

    it('keeps other console errors', () => {
        const event = mockConsoleEvent(['Could not turn on an experimental feature: ', 'reason']);

        expect(dropAnonRpcClientLogs(event)).toBe(event);
    });

    it('keeps an event not captured from the console', () => {
        const event = asErrorEvent({
            message: '[worker] failed',
            extra: { arguments: ['[worker]'] },
        });

        expect(dropAnonRpcClientLogs(event)).toBe(event);
    });

    it('passes on an event already dropped', () => {
        expect(dropAnonRpcClientLogs(null)).toBeNull();
    });
});
