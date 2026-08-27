import { redactSensitiveEventData } from './redactSensitiveEventData';

const descriptor =
    'xpub6ERApfZwUNrhLCkDtcHTcxd75RbzS1ed54G1LkBUHQVHQKqhMkhgbmJbZRkrgZw4koxb5JaHWkY4ALHY2grBGRjaDMzQLcgJvLJuZZvRcEL';

describe('redactSensitiveEventData', () => {
    it('redacts the payload embedded in an exception message', () => {
        const event = redactSensitiveEventData({
            type: undefined,
            exception: {
                values: [
                    {
                        type: 'Error',
                        value: `Invalid parameter "account.utxo" (= [{"address":"addr1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wxhxx9r9y"}]): Expected array`,
                    },
                ],
            },
        });

        expect(event?.exception?.values?.[0]?.value).toBe(
            'Invalid parameter "account.utxo" (= [redacted]): Expected array',
        );
    });

    it('redacts arguments captured from a console call', () => {
        const event = redactSensitiveEventData({
            type: undefined,
            extra: { arguments: [{ message: `compose failed for ${descriptor}` }] },
        });

        expect(event?.extra).toEqual({ arguments: [{ message: 'compose failed for [redacted]' }] });
    });

    it('redacts the event message and breadcrumbs', () => {
        const event = redactSensitiveEventData({
            type: undefined,
            message: `push failed: ${descriptor}`,
            breadcrumbs: [{ message: `fetching ${descriptor}`, data: { descriptor } }],
        });

        expect(event?.message).toBe('push failed: [redacted]');
        expect(event?.breadcrumbs?.[0]).toEqual({
            message: 'fetching [redacted]',
            data: { descriptor: '[redacted]' },
        });
    });

    it('passes a filtered out event through', () => {
        expect(redactSensitiveEventData(null)).toBeNull();
    });
});
