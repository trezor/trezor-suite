import { combineReducers, isRejected } from '@reduxjs/toolkit';

import { type AccountItem } from '@suite-common/graph';
import { configureMockStore } from '@suite-common/test-utils';

import { PORTFOLIO_GRAPH_INSTANCE_ID } from './graphInstances';
import { refetchGraphThunk } from './graphThunks';

// Serialize the way Sentry's captureConsoleIntegration does for an Error argument:
// the exception `value` is the message, and the stack is attached separately. Any raw
// console.error(error) would therefore ship both to Sentry unscrubbed.
const serializeLikeSentry = (arg: unknown) =>
    arg instanceof Error ? `${arg.message}\n${arg.stack ?? ''}` : String(arg);

const mockFetchGraphData = jest.fn();

jest.mock('@suite-common/graph', () => ({
    __esModule: true,
    ...jest.requireActual('@suite-common/graph'),
    fetchGraphData: (...args: unknown[]) => mockFetchGraphData(...args),
    getTimeFrameForHistoryHours: () => ({
        startOfTimeFrameDate: new Date(0),
        endOfTimeFrameDate: new Date(1),
    }),
}));

// accountKey is `${descriptor}-${symbol}-${deviceStaticSessionId}` (createAccountKey), and
// wallet-core throws `Account not found: ${accountKey}` on a lookup miss during graph refetch.
const DESCRIPTOR = 'xpubSENTINELdescriptorZZZ6MyQ';
const STATIC_SESSION_ID = 'sentinelSESSION@device_id:1';
const ACCOUNT_NOT_FOUND_ERROR = new Error(
    `Account not found: ${DESCRIPTOR}-btc-${STATIC_SESSION_ID}`,
);

const buildStore = () =>
    configureMockStore({ reducer: combineReducers({ graph: (state = {}) => state }) });

const dispatchRefetch = (store: ReturnType<typeof buildStore>) =>
    store.dispatch(
        refetchGraphThunk({
            instanceId: PORTFOLIO_GRAPH_INSTANCE_ID,
            accounts: [{ coin: 'btc' } as unknown as AccountItem],
            isDiscoveryRunning: false,
            timeframeHours: 24,
            isElectrumBackend: false,
            baseCurrencyCode: 'usd',
        }),
    );

describe('refetchGraphThunk confidential-data leak', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        mockFetchGraphData.mockReset();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    it('does not log the account descriptor or static session id when the graph fetch fails', async () => {
        mockFetchGraphData.mockRejectedValue(ACCOUNT_NOT_FOUND_ERROR);

        const result = await dispatchRefetch(buildStore());

        // The refetch rejected via the catch branch (not fulfilled).
        expect(isRejected(result)).toBe(true);

        // console.error must have been called, but with a sanitized value — the descriptor and
        // static session id must not reach it (captureConsoleIntegration would forward them to
        // Sentry verbatim, and redactSentryEvent does not scrub exception/message bodies).
        expect(consoleErrorSpy).toHaveBeenCalled();
        const loggedSerialized = consoleErrorSpy.mock.calls
            .flat()
            .map(serializeLikeSentry)
            .join('\n');
        expect(loggedSerialized).not.toContain(DESCRIPTOR);
        expect(loggedSerialized).not.toContain(STATIC_SESSION_ID);

        // The rejection payload returned to the UI is sanitized too.
        expect(JSON.stringify(result)).not.toContain(DESCRIPTOR);
        expect(JSON.stringify(result)).not.toContain(STATIC_SESSION_ID);
    });
});
