// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { identifyTransaction } from '@trezor/network-stellar';
import type { RawStellarTransaction } from '@trezor/network-stellar/types';

import { fixtures } from './__fixtures__/stellar';
import { getTokenMetadata, transformTransaction } from './stellar';

describe('stellar/utils', () => {
    describe('transformTransaction', () => {
        fixtures.transformTransaction.forEach(({ description, input, expectedOutput }) => {
            it(description, () => {
                const result = transformTransaction(
                    // @ts-expect-error Fixtures don't fully implement this interface.
                    identifyTransaction(input.tx as RawStellarTransaction),
                    input.descriptor,
                    {},
                );
                expect(result).toEqual(expectedOutput);
            });
        });
    });

    describe('getTokenMetadata', () => {
        const originalFetch = global.fetch;
        const mockFetch = (jsonBody: unknown) => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                statusText: 'OK',
                json: () => Promise.resolve(jsonBody),
            }) as unknown as typeof global.fetch;
        };

        afterEach(() => {
            global.fetch = originalFetch;
        });

        it('coerces a JSON `null` CDN body to an empty object (poison-response DoS)', async () => {
            // The unsigned data.trezor.io CDN is attacker/MITM-controllable; a `null` body must not
            // reach callers where `tokenMetadata[contract]?.name` would throw on null.
            mockFetch(null);
            await expect(getTokenMetadata()).resolves.toEqual({});
        });

        it('coerces a primitive CDN body to an empty object', async () => {
            mockFetch('not-an-object');
            await expect(getTokenMetadata()).resolves.toEqual({});
        });

        it('passes a valid object body through', async () => {
            const body = { 'ABC-GISSUER': { name: 'Alpha', symbol: 'ABC' } };
            mockFetch(body);
            await expect(getTokenMetadata()).resolves.toEqual(body);
        });
    });
});
