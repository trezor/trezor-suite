import { z } from 'zod';

import { createHttpClient } from '../httpClient';
import { RequestValidationError } from '../requestValidationError';

describe(createHttpClient.name, () => {
    it('validates and transforms every request part before calling fetch', async () => {
        const fetch = jest.fn().mockResolvedValue(
            new Response(JSON.stringify({ id: 'response-id' }), {
                headers: { 'Content-Type': 'application/json' },
            }),
        );
        const endpoint = createHttpClient({ baseUrl: 'https://example.test' }, { fetch })(
            '/:network/items/:id',
            {
                method: 'POST',
                schema: z.object({ id: z.string() }),
                requestSchemas: {
                    routeParams: z.object({ network: z.string(), id: z.string() }),
                    params: z.object({ limit: z.coerce.number() }),
                    body: z.object({ enabled: z.boolean() }),
                },
            },
        );

        await expect(
            endpoint({
                routeParams: { network: 'ethereum', id: 'item/one' },
                params: { limit: '10' },
                body: { enabled: true },
            }),
        ).resolves.toEqual({ id: 'response-id' });

        const request = fetch.mock.calls[0]?.[0] as Request;

        expect(request.url).toBe('https://example.test/ethereum/items/item%2Fone?limit=10');
        await expect(request.json()).resolves.toEqual({ enabled: true });
    });

    it('rejects invalid request data before calling fetch', async () => {
        const fetch = jest.fn();
        const endpoint = createHttpClient({}, { fetch })('/items', {
            method: 'POST',
            schema: z.object({ id: z.string() }),
            requestSchemas: {
                body: z.object({ enabled: z.boolean() }),
            },
        });

        const request = endpoint({ body: { enabled: 'yes' as unknown as boolean } });

        await expect(request).rejects.toBeInstanceOf(RequestValidationError);
        await expect(request).rejects.toHaveProperty('target', 'body');
        expect(fetch).not.toHaveBeenCalled();
    });
});
