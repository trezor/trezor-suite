import { type AccountKey } from '@suite-common/wallet-types';

import { getMultipleAccountBalanceHistoryWithFiat } from './graphDataFetching';
import { type AccountItem } from './types';

// Serializes a console.error argument the way Sentry's captureConsoleIntegration does:
// - an Error argument is promoted into an exception whose value = error.message
// - anything else is coerced/joined into event.message
// redactSentryEvent scrubs neither exception.value nor event.message, so both are leak channels.
const serializeAsSentryWould = (args: unknown[]): string =>
    args.map(arg => (arg instanceof Error ? `${arg.name}: ${arg.message}` : String(arg))).join(' ');

describe('getMultipleAccountBalanceHistoryWithFiat', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    beforeEach(() => {
        errorSpy.mockClear();
    });

    afterAll(() => {
        errorSpy.mockRestore();
    });

    it('does not leak the account descriptor / static session id to console.error (Sentry) when the balance-history fetch fails with "Account not found: <accountKey>"', async () => {
        // accountKey = `${descriptor}-${symbol}-${deviceStaticSessionId}` — both descriptor (xpub)
        // and the static session id are confidential and must never reach Sentry.
        const confidentialDescriptor = 'xpubSENTINELdescriptorDEADBEEF';
        const confidentialSessionId = 'staticSessionSENTINEL1234';
        const accountKey = `${confidentialDescriptor}-eth-${confidentialSessionId}` as AccountKey;

        // `eth` is a local-balance-history coin, so getAccountBalanceHistory dispatches
        // fetchTransactionsFromNowUntilTimestamp and unwraps it. A mock dispatch makes the unwrap
        // reject with the wallet-core "Account not found" throw that embeds the accountKey.
        const dispatch = jest.fn().mockReturnValue({
            unwrap: () => Promise.reject(new Error(`Account not found: ${accountKey}`)),
        });

        const account: AccountItem = {
            symbol: 'eth',
            descriptor: confidentialDescriptor,
            accountKey,
        };

        await expect(
            getMultipleAccountBalanceHistoryWithFiat({
                accounts: [account],
                startOfTimeFrameDate: null,
                endOfTimeFrameDate: new Date('2024-01-01T00:00:00Z'),
                baseCurrencyCode: 'usd',
                isElectrumBackend: false,
                dispatch: dispatch as any,
            }),
        ).rejects.toThrow();

        // The fetch failed and was logged; assert no logged argument — serialized the way Sentry
        // would — carries the confidential descriptor or static session id.
        expect(errorSpy).toHaveBeenCalled();
        errorSpy.mock.calls.forEach(callArgs => {
            const serialized = serializeAsSentryWould(callArgs);
            expect(serialized).not.toContain(confidentialDescriptor);
            expect(serialized).not.toContain(confidentialSessionId);
        });
    });
});
