import { formatAppsEmbeddingEvent } from './formatAppsEmbeddingEvent';
import { type AppsEmbeddingEvent } from './types';

const fixtures: { description: string; event: AppsEmbeddingEvent; expected: string }[] = [
    {
        description: 'loaded',
        event: { type: 'loaded', detail: 'iframe loaded: https://example.com/' },
        expected: 'loaded — iframe loaded: https://example.com/',
    },
    {
        description: 'navigated',
        event: { type: 'navigated', url: 'https://example.com/next' },
        expected: 'navigated — https://example.com/next',
    },
    {
        description: 'load-failed',
        event: { type: 'load-failed', detail: 'refused to connect' },
        expected: 'load failed — refused to connect',
    },
    {
        description: 'callback with success status',
        event: { type: 'callback', status: 'success', url: 'https://example.com/done' },
        expected: 'callback SUCCESS — https://example.com/done',
    },
    {
        description: 'callback with failure status',
        event: { type: 'callback', status: 'failure', url: 'https://example.com/failed' },
        expected: 'callback FAILURE — https://example.com/failed',
    },
    {
        description: 'message',
        event: { type: 'message', data: { foo: 'bar' } },
        expected: 'message {"foo":"bar"}',
    },
    {
        description: 'window-open-attempt',
        event: { type: 'window-open-attempt', url: 'https://example.com/popup' },
        expected: 'window.open denied — https://example.com/popup',
    },
    {
        description: 'closed',
        event: { type: 'closed', detail: 'user dismissed the browser' },
        expected: 'closed — user dismissed the browser',
    },
];

describe(formatAppsEmbeddingEvent.name, () => {
    fixtures.forEach(({ description, event, expected }) => {
        it(`formats a ${description} event`, () => {
            expect(formatAppsEmbeddingEvent(event)).toBe(expected);
        });
    });

    it('truncates message data that exceeds the single-line budget', () => {
        const data = 'x'.repeat(600);

        // The serialized form is the payload wrapped in quotes, so the kept
        // prefix is the opening quote plus 499 characters.
        expect(formatAppsEmbeddingEvent({ type: 'message', data })).toBe(
            `message "${'x'.repeat(499)}…`,
        );
    });

    it('keeps message data that fits the single-line budget intact', () => {
        const data = 'x'.repeat(498);

        expect(formatAppsEmbeddingEvent({ type: 'message', data })).toBe(`message "${data}"`);
    });

    it('reports message data that cannot be serialized', () => {
        const data: Record<string, unknown> = {};
        data.itself = data;

        expect(formatAppsEmbeddingEvent({ type: 'message', data })).toBe(
            'message [unserializable data]',
        );
    });

    it('reports message data that serializes to nothing', () => {
        // JSON.stringify returns undefined for undefined, which is no more
        // renderable than a value that throws.
        expect(formatAppsEmbeddingEvent({ type: 'message', data: undefined })).toBe(
            'message [unserializable data]',
        );
    });

    it('throws on an unknown event type so a new event cannot be logged silently', () => {
        const unknownEvent = { type: 'unknown' } as unknown as AppsEmbeddingEvent;

        expect(() => formatAppsEmbeddingEvent(unknownEvent)).toThrow('Unreachable case');
    });
});
